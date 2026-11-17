# Design

## Context

- 動機は proposal.md の Why を参照
- 公開リポジトリ（`yuuulf/toolbox`）。Actions の既定トークン権限は読み取りのみなので、書き込みが必要なワークフローは `permissions` で明示する
- Node は `mise.toml`（`node = "24"`）で管理し、検証コマンドは `npm run lint` / `npm run format:check` / `npm test` / `npm run build`
- OpenSpec CLI はローカルでは Homebrew の 1.15.0。npm の最新は 2.0.0（メジャーが違う）
- `openspec archive <change> -y` は、未完了タスクが残っていても警告を出すだけでアーカイブを続ける（作業用コピーで確認済み）。`skip_specs: true` の change は spec を更新せずに `changes/archive/<日付>-<name>/` へ移動するだけ
- `openspec list --json` は change ごとに `completedTasks` / `totalTasks` / `status`（`complete` など）を返す
- `.prettierignore` は `openspec/` を除外し、`.github/` は対象。ESLint は JS/TS だけを見る

## Goals / Non-Goals

**Goals:**

- ローカルの「変更を完了とする前に」と同じ4コマンドを、PR 上で同じ Node バージョンで実行する
- アーカイブの前提条件（config.yaml の `operations.archive` のうち機械的に確かめられるもの）を満たさないときはアーカイブしない
- 失敗理由を PR 上で読めるようにする

**Non-Goals:**

- spec と実装の整合をワークフローで判定すること（人のレビューに任せる）
- ワークフロー自体の自動テスト（actionlint による静的検査と、実際の PR での確認で代える）

## Decisions

### 1. 検証手順は composite action にまとめ、2つのワークフローから使う

`.github/actions/verify/action.yml` に「mise で Node を用意 → `npm ci` → lint / format:check / test / build」をまとめる。`ci.yml` とアーカイブのワークフローは、どちらもこれを1ステップで呼ぶ。

- 代替案: `ci.yml` を `workflow_call` で再利用する → 呼び出し先は別ジョブになり、アーカイブするコミットと検証したコミットが同じである保証が弱い。また呼び出し元と `concurrency` の group 名が重なると待ち合わせで止まる。採用しない
- 代替案: 両方に同じステップを書く → 手順の食い違いが起きるため採用しない

Node のセットアップは `jdx/mise-action` を使い、`mise.toml` を正とする（`actions/setup-node` にバージョンを二重に書かない）。

### 2. CI（`ci.yml`）

- トリガー: `pull_request`（既定の opened / synchronize / reopened）
- `permissions: contents: read`
- `concurrency` で同じ PR の古い実行を取り消す（`cancel-in-progress: true`）
- ジョブは verify を呼ぶだけ

### 3. アーカイブ（`openspec-archive.yml`）のトリガーと権限

- トリガー: `pull_request` の `labeled`。ジョブの `if` で `github.event.label.name == 'archive'` に限る
- `pull_request_target` は使わない。PR のコードを書き込み権限付きトークンで実行することになり、公開リポジトリでは危険なため
- その結果、fork からの PR ではトークンが読み取り専用になり、push もコメントもできない。fork の場合は最初のステップで失敗させ、理由をジョブサマリーに書く
- クローズ・マージ済みの PR にラベルを付けた場合も最初のステップで失敗させる。head ブランチが削除されていると、push でブランチを作り直してしまうため
- `permissions: contents: write`（push）、`pull-requests: write`（コメント・ラベル操作）、`issues: write`（ラベル削除 API）
- `concurrency` は PR ごと、`cancel-in-progress: false`（アーカイブ中の実行を途中で止めない）

### 4. アーカイブの手順

PR の head コミット（`github.event.pull_request.head.sha`）を `fetch-depth: 0` でチェックアウトし、次の順で進める。どこかで失敗したら以降は行わない。

1. **対象 change の特定**: `git diff --name-only <base.sha>...HEAD -- openspec/changes/` から `openspec/changes/<name>/` の `<name>` を集め、`archive` を除き、HEAD に今もディレクトリがあるものに絞る。ちょうど1件なら対象とし、0件・2件以上なら失敗する
   - 代替案: ラベル名やコメントで change 名を指定する → 操作が増えるうえ、1 PR 1 change の運用なら自動で決まるため採用しない
2. **未完了タスクの確認**: `openspec list --json` で対象の `status` が `complete`（`totalTasks > 0` かつ全完了）であることを確かめる。CLI の `-y` は未完了でも進むため、ここで止める
3. **検証**: `openspec validate <name> --strict` と verify（lint / format:check / test / build）
4. **アーカイブ**: `openspec archive <name> -y`。出力は PR コメント用に保存する
5. **差分の確認**: 変更が `openspec/` の外に出ていないことを確かめる
6. **コミットと push**: `github-actions[bot]` として `<name> をアーカイブ` でコミットし、`git push origin HEAD:refs/heads/<head.ref>` で push する。ラベルを付けた後にブランチが進んでいたら non-fast-forward で拒否されるので、そのまま失敗とする（古い内容のアーカイブで上書きしない）
7. **結果の通知**: 成功時はアーカイブ結果（移動先と同期した spec）を、失敗時は失敗したステップと実行ログへのリンクを PR にコメントする
8. **ラベルを外す**: 成否に関わらず `archive` ラベルを外す。付け直せば再実行できるようにするため

OpenSpec CLI は、手順 2 で使うため、チェックアウト直後に `jdx/mise-action` で Node を用意してから `npm install -g @fission-ai/openspec@1.15.0` で入れる（verify 内の mise-action は同じ Node をそのまま使う）。テレメトリと更新確認は `OPENSPEC_TELEMETRY=0` / `OPENSPEC_NO_UPDATE_CHECK=1` で止め、PR コメントに出力を載せるため `NO_COLOR=1` にする。ローカルと同じ版に固定し、2.x への更新は別の変更で行う。`package.json` に入れないのは、アプリの依存ではなく、ローカルでは Homebrew で管理しているため。

### 5. スクリプトインジェクション対策

ブランチ名・PR タイトルなど PR 作成者が決められる値は、`run:` の中に `${{ }}` で直接埋め込まず、`env:` 経由でシェル変数として参照する。

### 6. 確認方法

- 静的検査: `mise exec actionlint@1.7.12 shellcheck@0.11.0 -- actionlint` でワークフローを検査する（グローバルにはインストールしない。shellcheck を併用して `run:` のシェルも検査する）。YAML の整形は Prettier（`npm run format:check`）に任せる
- 実際の動作は、この change 自体の PR で確かめる。CI が走ること、未完了タスクがある状態で `archive` を付けると拒否のコメントが付くこと、を tasks で確認する
- 成功時の動作（アーカイブ・push・コメント）は、全タスク完了後にこの PR に `archive` を付け、この change 自体をアーカイブすることで確かめる。tasks.md には含めない（含めると、そのタスクが未完了のためアーカイブが拒否される）

## Risks / Trade-offs

- [GITHUB_TOKEN による push は他のワークフローを起動しないため、アーカイブのコミットには CI が走らない] → アーカイブ直前に同じ verify を同じツリーで実行済みで、追加される差分は `openspec/` だけ（lint・Prettier・テスト・ビルドの対象外）であることを手順 5 で確かめる。将来、必須チェックを設定して問題になったら GitHub App のトークンを検討する
- [アーカイブ先の日付は Actions の実行環境（UTC）の日付になる] → 日本時間 0〜9 時に実行すると前日の日付になる。並び順の目安にすぎないため許容する
- [OpenSpec 1.15.0 に固定するため、ローカルの CLI を更新すると挙動がずれうる] → 更新するときはワークフローの版も同じ変更で上げることを AGENTS.md に書く
- [1つの PR で複数の change を変更すると自動では特定できない] → 失敗コメントで理由を示す。1 PR 1 change の運用を AGENTS.md に書く
- [`archive` ラベルは書き込み権限を持つ人しか付けられない] → 意図どおり。アーカイブの実行者をメンテナーに限れる

## Migration Plan

1. ローカルの main（origin より2コミット先行）を push してから、作業ブランチ `add-ci-workflows` で PR を作る（push と PR 作成は実施前に確認を取る）
2. `archive` ラベルを `gh label create` で作る（実施前に確認を取る）
3. 戻すときはワークフローファイルとラベルを削除するだけでよい。アプリへの影響はない
