# Tasks

> アプリのロジック・UI は変更しないため、Vitest のテストは追加しない。ワークフローは actionlint（`mise exec actionlint@1.7.12 shellcheck@0.11.0 -- actionlint`、グローバルにはインストールしない）と Prettier で静的に検査し、動作はこの change の PR で確かめる（design.md 決定6）。npm コマンドは mise の Node 24 で実行する。

## 1. 検証の共通手順と CI

- [x] 1.1 `.github/actions/verify/action.yml`（composite action）を作成し、`jdx/mise-action` で `mise.toml` の Node を用意 → `npm ci` → `npm run lint` / `npm run format:check` / `npm test` / `npm run build` を順に実行する。各アクションはメジャーバージョンを指定する。`npm run format:check` が通ることを確認
- [x] 1.2 `.github/workflows/ci.yml` を作成する（`pull_request` トリガー、`permissions: contents: read`、PR ごとの `concurrency` で古い実行を取り消し、checkout 後に verify を呼ぶ）。actionlint と `npm run format:check` が通ることを確認

## 2. アーカイブのワークフロー

- [x] 2.1 `.github/workflows/openspec-archive.yml` の骨組みを作成する（`pull_request` の `labeled` で `archive` ラベルのときだけ実行、`permissions` は contents / pull-requests / issues の write、PR ごとの `concurrency`（取り消しなし）、fork の PR ならジョブサマリーに理由を書いて失敗、head コミットを `fetch-depth: 0` でチェックアウト）。PR 作成者が決められる値は `env:` 経由で参照する。actionlint が通ることを確認
- [x] 2.2 対象 change の特定と未完了タスクの確認のステップを追加する（design.md 決定4の1・2。0件・2件以上・未完了ありは失敗）。同じコマンドをローカルで実行し、`add-ci-workflows` だけが特定されること、作業用コピーで tasks.md に未完了を作ると失敗することを確認。actionlint が通ることを確認
- [x] 2.3 検証とアーカイブのステップを追加する（`openspec validate <name> --strict` → verify → `npm install -g @fission-ai/openspec@1.15.0` → `openspec archive <name> -y` → 変更が `openspec/` の外にないことの確認 → `github-actions[bot]` として `<name> をアーカイブ` でコミットし、`HEAD:refs/heads/<head.ref>` へ push）。作業用コピーで同じアーカイブ手順を実行し、差分が `openspec/` の中だけになることを確認。actionlint が通ることを確認
- [x] 2.4 結果の通知とラベル削除のステップを追加する（成功時はアーカイブ結果を、失敗時は失敗したステップ名と実行ログの URL を PR にコメント。成否に関わらず `archive` ラベルを外す）。actionlint が通ることを確認

## 3. ドキュメント

- [x] 3.1 README.md に CI（PR ごとに実行される4コマンド）と、`archive` ラベルによるアーカイブの使い方・条件（全タスク完了、1 PR 1 change、fork 不可）を追記する。AGENTS.md のディレクトリ構成に `.github/` を加え、「計画と変更の進め方」に 1 PR 1 change、アーカイブは `archive` ラベルで行うこと、OpenSpec CLI を更新するときはワークフローの固定版も同じ変更で上げることを追記する。`npm run format:check` が通ることを確認

## 4. 最終確認

- [x] 4.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` と actionlint がすべて成功することを確認する
- [x] 4.2 ユーザーの確認を取ってから、ローカルの main を push し、作業ブランチ `add-ci-workflows` で PR を作り、`gh label create archive` でラベルを作成する。PR で CI が実行されて成功することを `gh pr checks` で確認
- [x] 4.3 タスクが未完了の状態でその PR に `archive` ラベルを付け、アーカイブが拒否されて理由のコメントが付くこと、ラベルが外れること、ブランチにコミットが追加されないことを `gh pr view` と `git ls-remote` で確認

## Workflow follow-up

- 全タスク完了とレビューの後、この PR に `archive` ラベルを付けて change 自体をアーカイブし、`openspec/changes/archive/<日付>-add-ci-workflows/` への移動コミットが PR に追加されること、結果のコメントが付くこと、ラベルが外れることを確認する（成功時の動作確認を兼ねる）
- 確認後に PR をマージする
