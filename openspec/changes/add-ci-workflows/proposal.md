# Proposal

## Why

いまは lint・テスト・ビルドを手元で実行するしかなく、通っていない変更がマージされうる。また OpenSpec のアーカイブ（spec の同期と change の移動）も手作業で、実装を含む PR とアーカイブがずれやすい。PR 上で検証とアーカイブを自動化し、マージ前に両方がそろうようにする。

## What Changes

- GitHub Actions のワークフローを2つ追加する
  - **CI**: PR の作成・更新のたびに `npm run lint` / `npm run format:check` / `npm test` / `npm run build` を実行する
  - **OpenSpec アーカイブ**: PR に `archive` ラベルを付けると、同じ検証を通したうえで、その PR が変更している change を `openspec archive` でアーカイブし、結果をその PR のブランチにコミットして PR にコメントする。検証失敗・未完了タスク・対象 change が特定できない場合はアーカイブせず、理由をコメントする
- リポジトリに `archive` ラベルを作成する
- README.md と AGENTS.md に CI とアーカイブの流れを追記する

## Capabilities

### New Capabilities

なし（CI は開発フローのための設定で、アプリの振る舞いは変わらないため `skip_specs: true` とする）

### Modified Capabilities

なし

## データ保存

アプリのデータの扱いは変わらない（各ツールの保存先は add-toolbox-webapp の定義のまま）。ワークフローはリポジトリのコードだけを扱い、ユーザーデータには触れない。

## Out of scope

- main への push 時の CI、デプロイ、プレビュー環境
- Claude など AI による spec と実装の整合確認（整合はレビュアーが確認する）
- fork からの PR のアーカイブ（ブランチに push できないため、理由をコメントして終了する）
- ブランチ保護・必須チェックの設定
- 既に main にある add-toolbox-webapp のアーカイブ（このワークフローの導入後に別途行う）

## Impact

- 追加: `.github/workflows/ci.yml`、`.github/workflows/openspec-archive.yml`
- 更新: `README.md`、`AGENTS.md`
- GitHub リポジトリ設定: `archive` ラベルを追加
- 依存: OpenSpec CLI（`@fission-ai/openspec`）をワークフロー内でローカルと同じ 1.15.0 に固定してインストールする。`package.json` には追加しない
