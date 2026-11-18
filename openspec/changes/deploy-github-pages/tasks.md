# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `deploy-github-pages`。依存パッケージは追加しない。

## 1. 静的書き出しへの切り替え

- [ ] 1.1 `next.config.ts` に `output: 'export'` と `basePath: '/toolbox'` を加え、`cacheComponents` と `partialPrefetching` を外す（design.md D1・D2）。`npm run build` が成功し、`out/` に `index.html`・`404.html`・5つのツールの `tools/<slug>.html` が出力され、`out/index.html` のリンクとアセットの参照がすべて `/toolbox` で始まることを確認
- [ ] 1.2 `app/tools/[slug]/page.tsx` に `export const dynamicParams = false` を加え、Cache Components 前提のコメントを実態に合わせて直す。`proxy.ts` と `proxy.test.ts` を削除する。`app/layout.tsx` の `<Suspense>` は残し、コメントを直す（design.md D3）。`npm test` と `npm run build` が成功することを確認
- [ ] 1.3 `package.json` から `start` スクリプトを削除する（`npm install` は不要で、`package-lock.json` が変わらないことを確認）。README.md の「セットアップ」の URL を `http://localhost:3000/toolbox` に、「コマンド」の表から `npm run start` を削除し、AGENTS.md の構成図から `proxy.ts` を、Next.js の規約から Cache Components と `proxy.ts` の記述を外して static export・`basePath`・`dynamicParams = false` の説明に置き換える。`npm run lint` と `npm run format:check` が通ることを確認

## 2. デプロイのワークフロー

- [ ] 2.1 `.github/workflows/deploy.yml` を追加する（design.md D4）。`push`（main）と `workflow_dispatch` で動き、build ジョブ（checkout@v7 → `./.github/actions/verify` → `actions/upload-pages-artifact@v5` で `out/`）と deploy ジョブ（`environment: github-pages`、`actions/deploy-pages@v5`、このジョブだけ `pages: write` / `id-token: write`）、`concurrency: pages`（取り消さない）を持つ。追加前に両アクションの最新版を `gh api repos/actions/<name>/releases/latest` で確かめる。`npm run format:check` が通り、YAML として読めることを確認
- [ ] 2.2 README.md の「CI と OpenSpec のアーカイブ」にデプロイ（main へのマージで検証後に公開、手動再実行、公開 URL）を書き足し、冒頭に公開 URL を載せる。「データの扱い」に、公開版とローカルで localStorage が別になることを書く。AGENTS.md の構成図に `deploy.yml` を加える。`npm run format:check` が通ることを確認

## 3. 最終確認

- [ ] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [ ] 3.2 開発サーバーで `http://localhost:3000/toolbox` から一覧・ナビゲーション・ヘッダーのリンクをたどり、全ツールが表示・動作し、`/toolbox/tools/does-not-exist` で 404 ページが出ることを確認する。あわせて `out/` を `/toolbox` の下で配信し（リポジトリの外の一時的な静的サーバーで）、各ツールの直接アクセス・再読み込み、`/toolbox/tools/does-not-exist` が 404 ステータスで 404 ページになること、アセットの 404 がないことを確認する
- [ ] 3.3 ユーザーの確認を取ってから、GitHub Pages を公開元「GitHub Actions」で有効にする（design.md D5）。`gh api repos/yuuulf/toolbox/pages` が `build_type: workflow` を返すことを確認
- [ ] 3.4 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、deploy ワークフローが成功し、`https://yuuulf.github.io/toolbox/` で全ツール・404・再読み込みが動くことを確認する
