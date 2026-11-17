# Proposal

## Why

main には保護がなく、直接 push・force push・削除ができ、CI が失敗していてもマージできる。main を PR 経由・CI 成功時だけ更新できるようにする。

ただし CI（`verify`）を必須にすると、アーカイブのワークフローが PR のブランチに積むコミットには CI が走らない（`GITHUB_TOKEN` による push は他のワークフローを起動しない）ため、アーカイブした PR がマージできなくなる。先にこれを解消する。

## What Changes

- **CI**: `workflow_dispatch` でも起動できるようにする
- **アーカイブのワークフロー**: PR のブランチに push した後、`workflow_dispatch` で CI をそのブランチに対して起動し、アーカイブのコミットにも `verify` のチェックが付くようにする。起動できなかった場合は、PR を閉じて開き直せば CI が走ることを PR コメントで案内する
- **main の ruleset** を作成する
  - PR 必須（承認数 0）
  - 必須チェック: `verify`（GitHub Actions）
  - force push・ブランチ削除の禁止
  - バイパスなし（管理者にも適用）
- README.md と AGENTS.md に main の保護と、アーカイブ後の CI について追記する

## Capabilities

### New Capabilities

なし（開発フローの設定で、アプリの振る舞いは変わらないため `skip_specs: true`）

### Modified Capabilities

なし

## データ保存

アプリのデータの扱いは変わらない。

## Out of scope

- 承認（レビュー）の必須化、CODEOWNERS
- 「ブランチを最新にしてからマージ」の必須化
- マージ方法（merge / squash / rebase）の制限、マージ後のブランチ自動削除
- main 以外のブランチの保護
- PAT や GitHub App のトークンを使ったワークフローの起動

## Impact

- 更新: `.github/workflows/ci.yml`、`.github/workflows/openspec-archive.yml`、`README.md`、`AGENTS.md`
- GitHub リポジトリ設定: main の ruleset を追加
- 運用: main への直接 push ができなくなる（管理者も含む）。変更はすべて PR で行う
