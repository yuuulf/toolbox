<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# toolbox

便利ツールをまとめた Web アプリ（toolbox）。Next.js（App Router, TypeScript）+ Tailwind CSS。

## 開発環境

- Node.js は [mise](https://mise.jdx.dev/) で管理する。バージョンはリポジトリ直下の `mise.toml` が正（現在 `node = "24"`）
  - 初回: `mise install`
  - mise がシェルで有効化されていない環境では、コマンドを `mise exec -- <command>` で実行する（例: `mise exec -- npm test`）
  - Node のバージョンを変えるときは `mise.toml` を更新する。`.nvmrc` / `.node-version` / Volta 設定は追加しない
- パッケージマネージャは npm。`package-lock.json` をコミットし、yarn / pnpm / bun のロックファイルは作らない
- 環境変数は使わない（必要になったら計画で検討する）。秘密情報を `NEXT_PUBLIC_*` に入れない

## コマンド

| 用途             | コマンド                                             |
| ---------------- | ---------------------------------------------------- |
| 依存インストール | `npm install`                                        |
| 開発サーバー     | `npm run dev`                                        |
| Lint             | `npm run lint`                                       |
| フォーマット     | `npm run format`（確認のみ: `npm run format:check`） |
| テスト           | `npm test`（ウォッチ: `npm run test:watch`）         |
| ビルド           | `npm run build`                                      |

## ディレクトリ構成

Next.js の App Router 規約に従い、`app/` はルーティング専用とする。ルートで共有するコードは `app/` の外（`src/` なし、リポジトリ直下）に置く。

```
app/                      # ルーティングと Next.js 規約ファイルのみ
  layout.tsx              # 共通レイアウト
  page.tsx                # トップ（ツール一覧）
  not-found.tsx
  globals.css
  tools/[slug]/page.tsx   # 各ツールのページ
components/               # React コンポーネント
  sidebar.tsx             # 複数ページで使う共通 UI。幅 1024px 以上の左のサイドバー
  mobile-header.tsx       # 幅 1024px 未満の上部のバー
  mobile-menu.tsx         # 上部のバーのメニュー（<dialog>）
  brand-link.tsx          # アプリ名とアイコンのトップへのリンク
  tool-nav.tsx            # ツール一覧のナビゲーション（サイドバーとメニューで共通）
  copy-button.tsx
  tools/                  # ツール固有の UI
    registry.ts           # ツール登録情報（一覧・ナビ・ルートの唯一の情報源。UI を参照するためここに置く）
    json-formatter.tsx
lib/                      # React に依存しないロジック
  storage.ts
  base-path.ts            # ベースパス（/toolbox）。next.config.ts と metadata.icons で共有
  tools/
    json-format.ts
public/                   # 静的ファイル（basePath の下で配信される）
  favicon-light.png       # ファビコン（OS のライト/ダークで切り替え。app/layout.tsx の metadata.icons）
  favicon-dark.png
.github/
  actions/verify/         # lint / format:check / test / build（CI・アーカイブ・デプロイで共通）
  workflows/
    ci.yml                # PR ごとに verify を実行
    openspec-archive.yml  # archive ラベルで OpenSpec の change をアーカイブ
    deploy.yml            # main へのマージで verify 後に GitHub Pages へ公開
```

### Next.js の規約

- Next.js の API・規約は、冒頭のブロック（`next dev` が管理）の指示どおり `node_modules/next/dist/docs/` を正とする。この節と食い違う場合は docs に従い、この節を直す
- ルートは `app/` 配下のフォルダで表す。ルートが公開されるのは `page` か `route` ファイルがあるとき。このプロジェクトでは `route.ts` を作らない（データ方針のため）
- ルーティングの特殊ファイル（`layout` / `page` / `loading` / `not-found` / `error` / `global-error` / `route` / `template` / `default`）とメタデータの特殊ファイル（`favicon.ico` / `icon` / `apple-icon` / `opengraph-image` / `twitter-image` / `sitemap` / `robots`）は公式の名前と役割どおりに使い、ほかの用途のファイルにこれらの名前を付けない
- `app/` 内に置く必要がある、1ルート専用のコンポーネントはプライベートフォルダ `_components/` に入れる（URL に含まれない）。複数ルートで使うなら `components/` へ移す
- URL を変えずにまとめたいときはルートグループ `(group)` を使う
- page / layout を含め Server Component が既定。状態・イベント・ブラウザ API が必要なコンポーネントのファイル先頭（import より上）に `'use client'` を書く。そのファイルから import されるものはすべてクライアントバンドルに入るため、境界はできるだけ末端のコンポーネントに置く
- page を Client Component にすることもできるが、その場合 `async` にできず、`params` / `searchParams` は React の `use()` で読む
- Server から Client Component へ渡す props は React がシリアライズできる値だけにする（関数やコンポーネントを渡さない）
- 動的ルートの `params` / `searchParams` は Promise なので `await`（Client Component では `use()`）して使う。型には `PageProps<'/route'>` を使える
- `<title>` などのメタ情報は `metadata` / `generateMetadata` で設定し、`<head>` を直接書かない
- 内部リンクは `next/link`、画像は `next/image`、フォントは `next/font` を使う
- Route Handler（`app/**/route.ts`）や Server Action でユーザー入力を処理しない（データ方針のため）
- static export（`output: 'export'`）でビルドし、GitHub Pages で静的ファイルとして配信する。サーバーで動く機能（Proxy・Route Handler・Server Actions・rewrites / redirects / headers・ISR・`cookies()` などのリクエスト時の値・既定ローダーの `next/image` 最適化）は使わない。Cache Components も static export と同時に使えないため有効にしない
- `basePath` は `/toolbox`（開発サーバーも `http://localhost:3000/toolbox`）。値は `lib/base-path.ts` の `BASE_PATH` で、`metadata.icons` のように basePath が自動で付かない URL にはこれを付ける。`trailingSlash: true` でページを `<path>/index.html` として書き出す（GitHub Pages が同名のディレクトリを優先して 404 になるのを避けるため）。内部リンクは `next/link` を使えば自動で付くので、`<a href="/...">` や `fetch('/...')` のようにパスを直書きしない
- 動的ルートは `generateStaticParams` で書き出すページを列挙し、`dynamicParams = false` にする。列挙していないパスはファイルがないため、公開先が `404.html`（`app/not-found.tsx`）を 404 ステータスで返す

### コンポーネント分割

- 1ファイル1コンポーネント（そのファイル内だけで使う小さな部品は同じファイルに置いてよい）
- ロジックは `lib/` の純粋関数に切り出し、コンポーネントは状態管理と表示に専念する。コンポーネント内で計算処理を直接書かない
- 次のどれかに当てはまったら分割する: 2か所以上で使う／独立した状態を持つ／ファイルがおおむね 150 行を超える
- ツール UI が大きくなったら `components/tools/<tool-slug>/` ディレクトリにし、`<tool-slug>.tsx` と部品のファイルを並べる。`index.ts` によるまとめ export（barrel）は作らない
- カスタムフックは `use` で始める。1コンポーネント専用ならそのファイル内、共有するなら `hooks/` に置く

## コードスタイル

フォーマットは Prettier、ルールは ESLint で機械的に強制する。設定と食い違う手書きの整形はしない。

- ESLint は flat config（`eslint.config.mjs`）で、`eslint-config-next/core-web-vitals` と `eslint-config-next/typescript` を使い、最後に `eslint-config-prettier/flat` を置いて整形系ルールを無効化する。`next lint` は Next.js 16 で廃止されたため使わない（`npm run lint` は ESLint CLI を実行する）

- セミコロンなし（Prettier `semi: false`）
- シングルクォート（`singleQuote: true`）。JSX の属性はダブルクォート（Prettier 既定）
- インデント 2 スペース、末尾カンマあり（`trailingComma: 'all'`）
- 型だけの import は `import type` を使う（ESLint `@typescript-eslint/consistent-type-imports`）
- import は `@/` エイリアスを使う（同一ディレクトリ内は相対パス可）
- ファイル名はすべて kebab-case（公式ドキュメントの例に合わせる。例: `char-counter.tsx`、`char-count.ts`）
- コンポーネントは関数宣言 + 名前付き export で、コンポーネント名は PascalCase（`char-counter.tsx` に `CharCounter`）。Next.js の規約ファイル（`page.tsx`、`layout.tsx` など）は default export
- 関数・変数は camelCase、定数は `UPPER_SNAKE_CASE`
- 型は `type` で定義する（`interface` は使わない）。コンポーネントの props 型は `Props` という名前でファイル内に置く
- `any` を使わない。外部入力（localStorage、`JSON.parse` の結果など）は `unknown` で受けて検証する
- 想定内の失敗（不正な入力など）は例外ではなく結果型 `{ ok: true, ... } | { ok: false, error }` で返す。例外は想定外のエラーにだけ使う
- 意味のある数値（上限・既定値など）は名前付き定数にする
- コメントは日本語で、コードを読んでもわからない「なぜ」を書く
- スタイルは Tailwind のユーティリティクラスで書き、独自 CSS は `globals.css` の最小限に留める。間隔・色は Tailwind の既定スケールを使い、任意値（`p-[13px]` など）は避ける。ダークモードは `dark:` バリアントで OS 設定に追従する

## UI の統一

- UI の文言は日本語。ボタンは短い動詞（「整形」「生成」）、メッセージは「です・ます」調（「コピーしました」）
- 同じ操作・状態には同じ言葉と同じ見た目を使う（エラー表示・空状態の表示も共通の書き方にそろえる）
- コピーは必ずアイコンのみの `CopyButton` を使い、`label` で何をコピーするかを示す（アクセシブルな名前とツールチップになる）。結果はアイコンの切り替えと読み上げで伝え、画面に文字は出さない
- 入力欄には必ず `<label>` を付ける。ボタンは `<button type="button">`
- コピー完了やエラーなど、操作後に変わる表示は `aria-live="polite"` で読み上げられるようにする
- 状態を色だけで表さない（文言やアイコンを併用する）。キーボードだけで全操作できるようにする
- localStorage のキーは `toolbox:<tool-slug>:<name>` 形式にする

## テスト

- Vitest + React Testing Library。テストは対象と同じ場所に `*.test.ts(x)` で置く
- ロジック（`lib/`）は node 環境、コンポーネントはファイル先頭の `// @vitest-environment jsdom` で jsdom 環境
- ロジックや UI を追加・変更したら対応するテストも追加・更新する
- テスト名（`describe` / `it`）は日本語で振る舞いを書く（例: `it('絵文字の結合文字を1文字として数える')`）
- 要素は `getByRole` / `getByLabelText` など利用者から見える手がかりで取得し、`data-testid` は最後の手段にする

## 設計上の約束

- ユーザーの入力や生成結果をサーバー・外部サービスへ送信しない。保存は localStorage のみ（`lib/storage.ts` 経由、失敗しても動作を壊さない）
- ツールの追加は「`lib/tools/<name>.ts`（+テスト）→ `components/tools/<tool-slug>.tsx`（+テスト）→ `components/tools/registry.ts` に1エントリ」で完結させる
- ブラウザ標準 API で足りるものに依存パッケージを追加しない。依存を追加するときは理由を計画かコミットに残す

## 計画と変更の進め方

- 仕様と計画は OpenSpec（`openspec/`）で管理する。ルールは `openspec/config.yaml`
- タスクにない機能を追加しない。仕様と食い違う点は、コードで決めず計画の更新を提案する
- 1つの PR では1つの change だけを扱う（アーカイブのワークフローが対象を特定できなくなるため）
- アーカイブは、レビューで spec と実装の整合を確認した後、PR に `archive` ラベルを付けて行う（`.github/workflows/openspec-archive.yml`）。アーカイブのコミットに対する CI は承認待ちになるので、Approve and run で承認し、`verify` の成功を確認してからマージする（出ないときは PR を閉じて開き直す）
- ワークフローの OpenSpec CLI は、ローカルと同じ版に固定している（`openspec-archive.yml` の `@fission-ai/openspec@<版>`）。ローカルの CLI を更新するときは、同じ変更でこの版も上げる

## 変更を完了とする前に

1. `npm run lint`、`npm run format:check`、`npm test` が通る
2. README.md の更新が必要か確認し、必要なら同じ変更で更新する。次のどれかを変えたら更新が必要:
   - セットアップ手順・Node のバージョン・npm スクリプト
   - ツールの追加・削除・名前や説明の変更（README のツール一覧）
   - データの扱い（保存先、保存する内容）
   - ディレクトリ構成やツールの追加手順
3. AGENTS.md の内容（構成・コマンド・規約）と食い違いが生じたら AGENTS.md も更新する
4. 実施した検証と未実施の検証（手動確認が必要なものなど）を区別して報告する

## コミット

- コミットメッセージは短い日本語で書く（例: `文字数カウントツールを追加`）
- main へ直接 push しない。作業ブランチを切って PR を作る（main は ruleset で PR 必須・CI（`verify`）必須になっており、管理者も例外にしていない）
- CI 自体が壊れてどの PR もマージできなくなったときは、リポジトリ設定の ruleset（`main`）を一時的に無効化して修正をマージし、すぐに元へ戻す。ruleset の定義は `openspec/changes/archive/*-protect-main-branch/design.md` にある
- 1コミット1目的。フォーマットだけの変更は機能変更と分ける
- README・AGENTS.md の更新は、それを必要にしたコード変更と同じコミットに含める
