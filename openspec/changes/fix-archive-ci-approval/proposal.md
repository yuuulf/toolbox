# Proposal

## Why

アーカイブのワークフローは「`GITHUB_TOKEN` による push では `pull_request` の CI が走らないので、`workflow_dispatch` で CI を起動して必須チェック `verify` を満たす」という前提で作られている（protect-main-branch）。PR #3・#4 のアーカイブでわかった実際の動きは、この前提と違っていた。

- アーカイブのコミットにも `pull_request` の CI は起動されるが、承認待ち（`action_required`）で止まる。ユーザーが承認（Approve and run）すると走り、その `verify` が PR に付いてマージできるようになる
- `workflow_dispatch` で起動した CI は成功するが、PR のチェックに載らず、必須チェックを満たさない

このため、ワークフローは効果のない CI を余分に走らせている。さらに PR へのコメントと README が「CI を起動した」と案内するので、利用者は承認待ちの CI に気づかず、マージできない理由がわからなくなる。

## What Changes

- **アーカイブのワークフロー**（`openspec-archive.yml`）
  - push の後に `workflow_dispatch` で CI を起動するステップを削除する
  - そのために付けていた `actions: write` 権限を外す
  - 成功時のコメントを書き換え、アーカイブのコミットの CI は承認待ちになるので「Approve and run」で承認してからマージするよう案内する
- **CI**（`ci.yml`）: `workflow_dispatch` トリガーは、手動で再実行する手段として残す。アーカイブから起動する前提で書いたコメントは実態に合わせて直す
- **README.md / AGENTS.md**: アーカイブ後の手順を「承認待ちの CI を承認してからマージする」に改める。PR を閉じて開き直す回復手順は、承認の画面が出ないときの代替として残す

## Capabilities

### New Capabilities

なし（開発フローの設定で、アプリの振る舞いは変わらないため `skip_specs: true`）

### Modified Capabilities

なし

## データ保存

アプリのデータの扱いは変わらない（全ツールとも変更なし）。

## Out of scope

- CI の承認を不要にすること（リポジトリの Actions 設定の変更、PAT や GitHub App のトークンでの push）
- アーカイブのワークフローが自分で `verify` の結果を作ること
- main の ruleset の変更
- アーカイブ以外のワークフローの動作の変更
