# Design

## Context

- 動機は proposal.md の Why を参照
- CI のチェック名は `verify`（ジョブ名）。GitHub Actions アプリ（`integration_id: 15368`）が作るチェックラン
- `GITHUB_TOKEN` で起こしたイベントは新しいワークフロー実行を作らない。例外は `workflow_dispatch` と `repository_dispatch`（GitHub Docs「GITHUB_TOKEN」）
- `workflow_dispatch` は、ワークフローファイルがデフォルトブランチ（main）にあり、そこに `workflow_dispatch` トリガーがあるときだけ受け付けられる（GitHub Docs「Manually running a workflow」）。いまの main の `ci.yml` にはトリガーがない
- main には保護も ruleset もない。マージ方法は merge / squash / rebase すべて許可

## Goals / Non-Goals

**Goals:**

- アーカイブのコミットにも、実際に CI を走らせて `verify` のチェックを付ける
- CI を起動できなかったときも、PR を詰まらせずに回復できる手順を示す

**Non-Goals:**

- アーカイブのワークフローが自分で `verify` の結果を作ること（下の代替案を参照）

## Decisions

### 1. アーカイブ後の CI は `workflow_dispatch` で起動する

アーカイブのワークフローは push の後に `gh workflow run ci.yml --ref "$HEAD_REF"` を実行する。dispatch された実行は、そのブランチの最新コミット（＝アーカイブのコミット）に `verify` のチェックランを作る。

- `permissions` に `actions: write` を加える（dispatch に必要）
- `ci.yml` に `workflow_dispatch` を加える。`concurrency` の group は `github.event.pull_request.number || github.ref` にする。dispatch では PR 番号がないため、ブランチ単位でまとめる
- 代替案: アーカイブのワークフローが、Checks API で `verify` という名前の成功チェックをアーカイブのコミットに作る → 直前に同じツリーで検証しているので内容は正しい。ただし CI の結果を CI 以外が名乗ることになり、必須チェックの意味が弱くなるため採用しない
- 代替案: PAT や GitHub App のトークンで push する → シークレットの管理が増えるため採用しない（範囲外）

### 2. dispatch の失敗はアーカイブの失敗にしない

push まで済んでいれば、アーカイブ自体は完了している。dispatch に失敗した場合は警告を出し、成功のコメントに「CI を起動できなかったので、PR を閉じて開き直すと CI が走る」と書き添える。PR をユーザーが開き直すと `pull_request` の `reopened` で CI が走るため、ruleset 下でも回復できる。

この change の PR では、main の `ci.yml` にまだトリガーがないため dispatch は必ず失敗する。そのため、この案内の経路で確かめることになる。

### 3. main の ruleset

`gh api -X POST repos/yuuulf/toolbox/rulesets` で次を作る（クラシックなブランチ保護ではなく、現在の推奨である ruleset を使う）。

```json
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [{ "context": "verify", "integration_id": 15368 }]
      }
    }
  ]
}
```

- `bypass_actors: []` で管理者も例外にしない
- `integration_id` を GitHub Actions に固定し、ほかのアプリやコミットステータスで `verify` を名乗れないようにする
- `strict_required_status_checks_policy: false`: main が進むたびに PR のブランチを更新させない（範囲外）
- ruleset はリポジトリ設定でコードに残らないため、この design に定義を残す。変更するときは design と同じ内容を API で反映する

### 4. ruleset を作るタイミング

この PR の CI が通った後、アーカイブ（`archive` ラベル）の前に作る。作った後は、この PR 自体が ruleset の下でマージされることになるため、実際の動きを確かめられる。アーカイブのコミットに `verify` が付かない（決定2のとおり dispatch が失敗する）ので、PR を開き直して CI を走らせ、マージできることを確かめる。

## Risks / Trade-offs

- [管理者もバイパスできないため、CI が壊れると誰もマージできなくなる] → ruleset の設定（管理者は編集できる）を一時的に変えて回復する。手順を AGENTS.md に書く
- [dispatch された実行のチェックランが PR の必須チェックとして扱われることを、この PR では確かめられない] → 次に change を含む PR をアーカイブするときに確かめる。扱われなかった場合も、決定2の「開き直し」で回復できる
- [PR のブランチの先頭が dispatch の前に進んだ場合、CI は進んだ後のコミットで走る] → 新しいコミットには通常の `pull_request` の CI も走るため、問題にならない

## Migration Plan

1. この change の PR で CI が通ったら、ruleset を作る（実施前にユーザーの確認を取る）
2. 戻すときは ruleset を削除し、ワークフローの dispatch のステップと `workflow_dispatch` トリガーを外す
