# Proposal

## Why

toolbox はまだどこにも公開されておらず、使うにはローカルで開発サーバーを起動する必要がある。main にマージしたら自動で公開され、いつでもブラウザから使える状態にしたい。

公開先は GitHub Pages にする。リポジトリは公開されていて、すべてのツールがブラウザ内で完結する（サーバー処理がない）ため静的ファイルの配信で足りる。外部サービスのアカウントやトークンを増やさず、GitHub の中で完結できるのも理由の一つ。

## What Changes

- **main へのマージで自動デプロイする**
  - main への push（PR のマージ）をきっかけに GitHub Actions のワークフローを動かし、CI と同じ検証（lint / format:check / test / build）が通ったときだけ GitHub Pages へ公開する。検証に失敗したら公開せず、前の版が公開されたままになる
  - Actions の画面から手動で再デプロイもできる
  - 公開 URL は `https://yuuulf.github.io/toolbox/`
- **静的ファイルとして書き出す**（Next.js の static export）
  - **BREAKING（開発者向け）**: すべてのパスに `/toolbox` が付く。開発サーバーも `http://localhost:3000/toolbox` で開く
  - Cache Components を無効にする（static export と同時に使えないため。ビルドで `PPR cannot be enabled in export mode` になることを確認済み）
  - `proxy.ts` を削除する（static export では使えない）。未登録の `/tools/<slug>` は、GitHub Pages が `404.html` を 404 ステータスで返すことで 404 ページになる
  - `npm run start` を削除する（static export では `next start` を使えない）
- **リポジトリ設定**: GitHub Pages を有効にし、公開元を「GitHub Actions」にする（初回のみ）
- README と AGENTS.md に、公開 URL・デプロイの流れ・開発サーバーの URL・Cache Components と proxy の記述の変更を反映する

## Capabilities

### New Capabilities

- `toolbox-deployment`: main へのマージをきっかけに、検証を通った版だけを GitHub Pages へ公開する

### Modified Capabilities

- `toolbox-shell`: 「ツールごとのページ」で、各パスが公開先のベースパス（`/toolbox`）の下にあることを明記する。未登録 slug で 404 ページを返す要件は変えない

## データ保存

すべてのツールで変更なし（JSON整形/検証・文字数カウントはなし、UUID/パスワード生成・カラー変換/コントラスト・チェックリストは従来どおり localStorage）。公開先が変わるだけで、入力内容をサーバーへ送らない方針もそのまま。

なお localStorage はオリジン（`https://yuuulf.github.io`）ごとに分かれるため、ローカルの開発サーバーで保存したお気に入りやチェックリストは公開版には引き継がれない。

## Out of scope

- 独自ドメインの設定
- PR ごとのプレビュー環境
- Vercel など GitHub Pages 以外の公開先
- 公開版の死活監視やアクセス解析

## Impact

- `next.config.ts`（`output: 'export'`、`basePath`、Cache Components の無効化）
- `app/tools/[slug]/page.tsx`（`dynamicParams = false`）、`app/layout.tsx`（コメント）
- `proxy.ts`・`proxy.test.ts` の削除
- `package.json`（`start` スクリプトの削除）
- `.github/workflows/deploy.yml` の追加（既存の `.github/actions/verify` を再利用）
- README.md、AGENTS.md
- 依存パッケージの追加はなし
