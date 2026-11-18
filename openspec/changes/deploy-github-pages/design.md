# Design

## Context

- 現在は `next build` が Node.js サーバー向けの出力を作る。`next.config.ts` で Cache Components（`cacheComponents` / `partialPrefetching`）が有効。
- 未登録の `/tools/<slug>` は `proxy.ts` が `/__not-found` に書き換えて 404 ステータスを返している。Cache Components ではページ内の `notFound()` がシェル送信後に走り、200 になってしまうため。
- GitHub Pages は静的ファイルを配信するだけで、ビルドも Node.js の実行もしない。公開 URL はプロジェクトサイトの `https://yuuulf.github.io/toolbox/`。存在しないパスには、サイト直下の `404.html` を 404 ステータスで返す。
- CI（`.github/workflows/ci.yml`）とアーカイブのワークフローは、どちらも composite action `.github/actions/verify`（lint / format:check / test / build）を使っている。
- リポジトリでは GitHub Pages がまだ有効になっていない（`gh api repos/yuuulf/toolbox/pages` は 404）。

## Goals / Non-Goals

**Goals:**

- `npm run build` の出力（`out/`）をそのまま GitHub Pages に置けば、すべてのページが動くようにする
- デプロイのワークフローは CI と同じ検証を通す。検証の手順は `.github/actions/verify` だけに書き、二重に管理しない

**Non-Goals:**

- 開発サーバーと公開版でパスを変えること（ベースパスは両方に付ける。下記 D2）
- `out/` をローカルで配信するためのスクリプトや依存の追加

## Decisions

### D1. static export にし、Cache Components を無効にする

`next.config.ts` に `output: 'export'` を指定し、`cacheComponents` と `partialPrefetching` を外す。

- 試しに `output: 'export'` と Cache Components を同時に有効にしてビルドすると、`Error: Invariant: PPR cannot be enabled in export mode` で失敗した（作業用のコピーで確認）。外すと、5つのツールのページと `404.html` が `out/` に出力された。
- このアプリは `'use cache'` もリクエスト時の値も使っていないため、Cache Components を外しても失う機能はない。日付などブラウザで決める値は、今までどおり `useSyncExternalStore` でクライアント側で決める（チェックリスト）。
- 検討した他の方法: Next.js をそのまま動かせる Vercel・Cloudflare Workers・Netlify。相談の結果、GitHub の中で完結する GitHub Pages を選んだ（proposal.md の Why）。

### D2. `basePath: '/toolbox'` は開発時にも付ける

プロジェクトサイトは `/toolbox/` の下で配信されるため、`basePath: '/toolbox'` を指定する。`next/link` のリンクと `_next/` のアセット・favicon には自動で付く（試しにビルドした `out/index.html` で確認済み）。

- 本番ビルドだけに付ける案もあった（`NODE_ENV` や環境変数で切り替える）。しかし開発時と公開版でパスが変わると、ベースパスの付け忘れ（`<a href="/...">` や `fetch('/...')` を直書きするなど）に開発中に気づけない。AGENTS.md は環境変数を使わない方針でもあるため、常に付ける。
- 開発サーバーは `http://localhost:3000/toolbox` で開くことになる。README に書く。

### D2a. `trailingSlash: true` でページを `<path>/index.html` として書き出す

既定の書き出しでは `tools/<slug>.html` と、クライアント遷移用のデータを入れた同名のディレクトリ `tools/<slug>/` が並ぶ。GitHub Pages は同名のディレクトリがあるとそちらを優先して `tools/<slug>/` にリダイレクトし、`index.html` がないので 404 になる（実装中に、この規則をまねた静的サーバーで再現した）。`trailingSlash: true` にすると `tools/<slug>/index.html` になり、`/tools/<slug>` は `/tools/<slug>/` にリダイレクトされて表示される。リンクの URL は末尾に `/` が付く。

### D3. 未登録 slug の 404 は `dynamicParams = false` と GitHub Pages の `404.html` で返す

- `proxy.ts` と `proxy.test.ts` を削除する。static export では Proxy を使えない。
- `app/tools/[slug]/page.tsx` に `export const dynamicParams = false` を加え、`generateStaticParams` に含まれない slug をビルドで出力しないことを明示する。Cache Components を外したので、このオプションを使えるようになった。
- ビルドが出力する `404.html`（`app/not-found.tsx`）を、GitHub Pages が存在しないパスに 404 ステータスで返す。ページ内の `getTool` と `notFound()` は、型を絞るために残す。
- `app/layout.tsx` の `<Suspense>` はそのまま残す。static export では `usePathname` が中断しないので不要になるが、外しても利点がなく、将来サーバー版に戻すときに必要になるため。コメントだけ実態に合わせて直す。

### D4. デプロイのワークフロー `.github/workflows/deploy.yml`

- **トリガー**: `push`（`branches: [main]`）と `workflow_dispatch`。main は ruleset で PR 必須なので、main への push は PR のマージだけになる。アーカイブのワークフローが push するのは PR のブランチなので、デプロイは起きない。
- **build ジョブ**: checkout → `./.github/actions/verify`（ここで `npm run build` が `out/` を作る）→ `actions/upload-pages-artifact`（`path: out`）。verify のどこかが失敗すればアップロードまで進まないので、公開もされない。
- **deploy ジョブ**: `needs: build`、`environment: github-pages`、`actions/deploy-pages` で公開する。
- **権限**: ワークフロー全体は `contents: read`。deploy ジョブだけに `pages: write` と `id-token: write` を付ける。認証は組み込みの `GITHUB_TOKEN` と OIDC で行い、リポジトリにシークレットを置かない。
- **同時実行**: `concurrency: { group: pages, cancel-in-progress: false }`。マージが続いても公開の途中で取り消さず、順に公開する。
- **バージョン**: 計画時点での最新は `actions/upload-pages-artifact@v5`、`actions/deploy-pages@v5`。checkout は既存の CI に合わせて `@v7`。`actions/configure-pages` は、`basePath` を自分で設定するので使わない。
- **`.nojekyll`**: `upload-pages-artifact` + `deploy-pages` の方式では Jekyll が動かないので、`_next/` を配信するための `.nojekyll` は不要。

### D5. GitHub Pages を有効にする（リポジトリ設定、初回のみ）

公開元を「GitHub Actions」にして Pages を有効にする（`gh api -X POST repos/yuuulf/toolbox/pages -f build_type=workflow`、または Settings → Pages → Source で GitHub Actions を選ぶ）。リポジトリの外から見える変更なので、実装のときに管理者の確認を取ってから行う。有効にすると `github-pages` 環境が作られる。

## Risks / Trade-offs

- [`npm run start` がなくなり、ローカルで本番ビルドを確認する手段が減る] → `npm run dev` で確認する。どうしても `out/` を見たいときは、手元にある静的サーバーで `out/` を `/toolbox` として配信する。依存は追加しない。
- [ベースパスの付け忘れで、公開版だけリンク切れになる] → D2 で開発時にもベースパスを付ける。`next/link` を使うという既存の規約で防げる。
- [公開版と開発サーバーで localStorage が別になり、保存した内容が引き継がれない] → オリジンが違うため仕方がない。README の「データの扱い」に書く。
- [Next.js の更新で static export の対応範囲が変わる] → CI の `npm run build` が `output: 'export'` でビルドするので、壊れれば PR の段階で気づける。
- [デプロイが失敗しても気づきにくい] → Actions の失敗通知（GitHub の既定のメール通知）に任せる。監視は対象外。

## Migration Plan

1. この change の PR をマージする前に、D5 で Pages を有効にしておく（有効でないと、マージ後の deploy ジョブが失敗する）。
2. マージすると deploy.yml が動き、`https://yuuulf.github.io/toolbox/` が公開される。
3. 公開版で全ツールのページ・404・再読み込みを確認する。
4. 元に戻すときは、この change を revert する PR を出すか、Settings → Pages で公開を止める。
