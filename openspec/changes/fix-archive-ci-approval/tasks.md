# Tasks

> アプリのロジック・UI は変更しないため、Vitest のテストは追加しない。ワークフローは actionlint（`mise exec actionlint@1.7.12 shellcheck@0.11.0 -- actionlint`）と Prettier で静的に検査し、動作はこの change の PR のアーカイブで確かめる。npm コマンドは mise の Node 24 で実行する。

## 1. ワークフロー

- [x] 1.1 `openspec-archive.yml` から「CI の起動」ステップと `permissions` の `actions: write` を削除し、「成功のコメント」から `CI_STARTED` による分岐をなくして、承認待ちの CI を「Approve and run」で承認してからマージすること、PR の Checks へのリンク、承認の画面が出ないときは PR を開き直すことを常に書く（design.md 決定1・2）。作業用コピーでコメント本文を生成して文面を確認し、actionlint と `npm run format:check` が通ることを確認
- [x] 1.2 `ci.yml` の `workflow_dispatch` のコメントを「手動で再実行するため。dispatch の実行は PR の必須チェックを満たさない」という趣旨に直す（design.md 決定3）。actionlint と `npm run format:check` が通ることを確認

## 2. ドキュメント

- [x] 2.1 README.md の「CI と OpenSpec のアーカイブ」節と AGENTS.md の「計画と変更の進め方」のアーカイブの項目を、design.md 決定4のとおり更新する。`openspec-archive.yml` の dispatch に触れた記述がほかに残っていないことを `grep -rn "workflow_dispatch\|CI を自動で起動\|CI を起動" README.md AGENTS.md .github` で確認し、`npm run format:check` が通ることを確認

## 3. 最終確認

- [x] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` と actionlint がすべて成功することを確認する
- [x] 3.2 ユーザーの確認を取ってから、作業ブランチ `fix-archive-ci-approval` を push して PR を作り、CI（`verify`）が成功することを `gh pr checks` で確認

## Workflow follow-up

- この PR に `archive` ラベルを付け、アーカイブのコメントが新しい文面（承認の案内）になっていること、dispatch の CI 実行が作られないこと（`gh run list --branch fix-archive-ci-approval` に `workflow_dispatch` がない）を確認する
- 承認待ちの CI を承認し、`verify` が成功してマージ状態が `CLEAN` になることを確認してからマージする
