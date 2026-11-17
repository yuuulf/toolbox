# Design

## Context

- 動機は proposal.md の Why を参照
- PR #3・#4 での観測:
  - アーカイブのコミット（github-actions[bot] が push）には `pull_request` の CI 実行が作られるが、`action_required`（ジョブ0件）で止まる
  - ユーザーが承認すると走り、その `verify` が PR の `statusCheckRollup` に載ってマージ状態が `CLEAN` になる
  - `workflow_dispatch` の実行は head コミットに `verify` の成功チェックランを作るが、PR の `statusCheckRollup` は null のままで、マージ状態は `BLOCKED` だった
- 現在の `openspec-archive.yml` は、protect-main-branch の design（決定1・2）に基づき、push 後に `gh workflow run ci.yml` を実行し、結果に応じてコメントの文面を切り替えている
- `ci.yml` には `workflow_dispatch` トリガーと、そのための `concurrency` の group（`github.event.pull_request.number || github.ref`）がある

## Goals / Non-Goals

**Goals:**

- アーカイブ後にマージするための手順（承認待ちの CI を承認する）を、PR コメントと README で正しく案内する
- 効果のない CI 実行と、そのための権限をなくす

**Non-Goals:**

- 承認なしでアーカイブのコミットに `verify` を付ける仕組み（proposal の Out of scope）
- 承認が必要になる理由の解明。観測された動作を前提に案内する

## Decisions

### 1. dispatch のステップと `actions: write` を削除する

protect-main-branch の決定1・2を置き換える。dispatch の実行は必須チェックを満たさないので、残しても CI を1回余分に走らせるだけになる。権限は最小にする方針なので `actions: write` も外す。

- 代替案: 保険として残す → 結果がマージ条件に数えられない以上、保険にならない。そのうえ「CI を起動しました」というコメントが利用者を誤解させるため採らない

### 2. 成功のコメントで承認を案内する

dispatch の成否で文面を分ける処理（`CI_STARTED`）をやめ、常に次の内容を書く:

- アーカイブのコミットに対する CI（`verify`）は承認待ちになる
- PR の Checks（`$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/pull/$PR_NUMBER/checks`）か Actions で「Approve and run」を押して承認し、`verify` が成功してからマージする
- 承認の画面が出ないときは、PR を閉じて開き直すと CI が走る

承認待ちの実行を探してリンクを直接載せる方法もある。ただし push の直後には実行がまだ作られていないことがあり、待ち合わせが必要になる。そこまでの手間をかける価値はないため、PR の Checks へのリンクに留める。

### 3. `ci.yml` の `workflow_dispatch` は残す

手動で CI を再実行する手段として役に立つ。ただし dispatch の実行が PR の必須チェックを満たさないことは、コメントで明記する。`concurrency` の group は dispatch のときにブランチ単位でまとめるために必要なので、そのまま残す。

### 4. ドキュメント

- README の「CI と OpenSpec のアーカイブ」節: 「アーカイブのコミットには CI を自動で起動します」と、CI を起動できなかったときの案内を消し、「アーカイブのコミットの CI は承認待ちになるので、承認してからマージする（出ないときは PR を開き直す）」と書く
- AGENTS.md の「計画と変更の進め方」のアーカイブの項目: マージ前に承認待ちの CI を承認することを書き足す
- ruleset の定義の参照先（`openspec/changes/archive/*-protect-main-branch/design.md`）は変わらないので、AGENTS.md の該当箇所はそのままにする

## Risks / Trade-offs

- [GitHub の動作が変わり、承認なしで CI が走るようになる] → コメントの案内が「承認の画面が出なければ不要」と読めるようにする。案内が少しずれるだけで、マージは妨げない
- [アーカイブのたびに手作業（承認）が1回必要] → いまも実質的に同じ。案内を正しくして、迷わずに済むようにする
- [この change 自体のアーカイブでは、main の `openspec-archive.yml`（古い版）がまだ動く] → `pull_request` の `labeled` は PR の head のワークフローを使う。この PR では新しい版が動くはずなので、ここで確かめる（tasks の Workflow follow-up）

## Migration Plan

ワークフローとドキュメントだけの変更。戻すときはこの change のコミットを revert する。
