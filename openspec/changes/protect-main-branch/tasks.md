# Tasks

> アプリのロジック・UI は変更しないため、Vitest のテストは追加しない。ワークフローは actionlint（`mise exec actionlint@1.7.12 shellcheck@0.11.0 -- actionlint`）と Prettier で静的に検査し、動作はこの change の PR で確かめる。npm コマンドは mise の Node 24 で実行する。

## 1. ワークフロー

- [x] 1.1 `ci.yml` に `workflow_dispatch` トリガーを加え、`concurrency` の group を `ci-${{ github.event.pull_request.number || github.ref }}` にする。actionlint と `npm run format:check` が通ることを確認
- [x] 1.2 `openspec-archive.yml` の `permissions` に `actions: write` を加え、push の後に `gh workflow run ci.yml --ref "$HEAD_REF"` で CI を起動するステップを追加する。失敗してもジョブは失敗させず、成功のコメントに「CI を起動できなかったので、PR を閉じて開き直すと CI が走る」旨を書き添える（成功時は「CI を起動した」旨）。作業用コピーでコメント本文を両方のケースで生成して確認し、actionlint が通ることを確認

## 2. ドキュメント

- [x] 2.1 README.md の CI の節に「main は保護されていて PR 経由・`verify` 成功時だけマージできる」「アーカイブのコミットには CI が自動で起動される。起動できなかったら PR を開き直す」を追記する。AGENTS.md の「コミット」か「計画と変更の進め方」に、main へ直接 push しないこと、CI が壊れてマージできないときは ruleset を一時的に変えて回復することを追記する。`npm run format:check` が通ることを確認

## 3. 最終確認と ruleset

- [x] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` と actionlint がすべて成功することを確認する
- [ ] 3.2 ユーザーの確認を取ってから、作業ブランチ `protect-main-branch` を push して PR を作り、CI が成功することを `gh pr checks` で確認
- [ ] 3.3 ユーザーの確認を取ってから、design.md 決定3の定義で main の ruleset を作成する。`gh api repos/yuuulf/toolbox/rules/branches/main` で deletion / non_fast_forward / pull_request / required_status_checks（`verify`）が有効なこと、ruleset の `bypass_actors` が空であることを確認

## Workflow follow-up

- 全タスク完了後、この PR に `archive` ラベルを付ける。アーカイブのコミットが追加され、main にまだトリガーがないため CI の起動に失敗し、成功のコメントに「開き直す」案内が付くことを確認する
- PR を閉じて開き直し、CI が走って `verify` が成功し、ruleset の下でマージできる（`gh pr view --json mergeStateStatus` が `CLEAN`）ことを確認してからマージする
- 次に change を含む PR をアーカイブするとき、dispatch で起動した CI のチェックがアーカイブのコミットに付き、開き直さずにマージできることを確認する
