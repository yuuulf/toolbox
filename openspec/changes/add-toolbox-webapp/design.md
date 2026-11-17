# Design

## Context

リポジトリには README.md・mise.toml・OpenSpec 設定・規約案（AGENTS_bk.md）しかない新規プロジェクト。動機とスコープは proposal.md を、振る舞いは各 spec（`toolbox-shell`、`tool-json-formatter`、`tool-char-counter`、`tool-id-generator`）を参照。制約は「Next.js App Router + TypeScript + Tailwind CSS + npm」「サーバーにデータを保存しない／永続化は localStorage のみ」。Node.js は mise で管理し、リポジトリ直下の `mise.toml`（`node = "24"`）に従う。開発規約（ディレクトリ構成・コードスタイル・コミット）は `AGENTS.md` を正とする。ただし現時点の規約案は `AGENTS_bk.md` にあり、create-next-app が生成する `AGENTS.md` を優先したうえで必要分を統合する（決定1）。対象は Next.js 16。

## Goals / Non-Goals

**Goals:**
- ツールを1件追加する作業が「ロジック・UIコンポーネントの作成 + レジストリへ1エントリ追加」で完結する構成
- 各ツールのロジックを UI から分離し、純粋関数として単体で検証できるようにする
- 静的に配信できる構成（サーバー側の状態・API Routes を持たない）

**Non-Goals:**
- E2E テスト（Playwright 等）の導入。ルーティング・ネットワーク非送信・レスポンシブは build 出力と手動確認で検証し、E2E は将来チェンジ
- 状態管理ライブラリ、UIコンポーネントライブラリの導入

## Decisions

### 1. プロジェクト生成は `create-next-app` の標準構成を使う
`npx create-next-app@latest toolbox --ts --tailwind --eslint --app --use-npm --no-src-dir --import-alias "@/*"` 相当で生成する。それ以外は create-next-app の既定（Turbopack、Cache Components、AGENTS.md 生成、React Compiler なし）に従う。Tailwind も既定（v4、`@import "tailwindcss"`）に従う。
- リポジトリには既存ファイル（README.md、mise.toml、openspec/、.claude/、AGENTS_bk.md）があり、空でないディレクトリへの生成は拒否される可能性があるため、リポジトリ外の一時ディレクトリに生成してから、生成物（`node_modules/` と `.git/` を除く）をリポジトリ直下へ移し、`npm install` し直す。README.md は既存のものを残す（タスク 2.7 で書き直す）。
- **AGENTS.md の扱い**: create-next-app が生成した `AGENTS.md`（Next.js 用のエージェント向け指示）をそのまま優先して採用し、`AGENTS_bk.md` から生成物にない必要分（開発環境・ディレクトリ構成・コードスタイル・UI・テスト・設計上の約束・完了前チェック・コミット）を追記する。内容が食い違う場合は生成された `AGENTS.md` の記述を残す。統合後に `AGENTS_bk.md` を削除する。生成時に `CLAUDE.md` など関連ファイルが作られた場合も残す。
- 代替案: 手動セットアップ → 設定の手間とバージョン不整合のリスクが増えるだけなので不採用。
- 生成コマンドを含む npm 操作は mise で有効化した Node 24 で実行する（シェルで未有効化なら `mise exec --` 経由）。

### 1.1 フォーマットと型 import の統一
create-next-app の生成物はダブルクォート・セミコロンありのため、`AGENTS.md` のスタイルに合わせて生成直後に統一する。
- Prettier: `.prettierrc.json` に `semi: false`、`singleQuote: true`、`trailingComma: 'all'`。`.prettierignore` で `.next/`・`package-lock.json` などを除外。
- ESLint: 生成された flat config（`eslint.config.mjs`、`eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`）の最後に `eslint-config-prettier/flat` を追加して整形系ルールを無効化し（公式推奨）、`@typescript-eslint/consistent-type-imports` を error で有効化（eslint-config-next/typescript が読み込む typescript-eslint を利用）。
- `package.json` に `"format": "prettier --write ."`、`"format:check": "prettier --check ."` を追加し、生成物を一括整形する。
- 代替案: Biome で lint と format を統合 → create-next-app 標準の ESLint（Next.js 用ルール）を捨てることになるため不採用。

### 2. ディレクトリ構成

```
app/
  layout.tsx            # 共通レイアウト（Header + ToolNav + main）
  page.tsx              # ツール一覧（レジストリから生成）
  not-found.tsx
  tools/[slug]/page.tsx # レジストリから slug 解決、未登録は notFound()
components/
  header.tsx, tool-nav.tsx (client: usePathname で現在地強調), tool-card.tsx, copy-button.tsx
  tools/registry.ts     # ツール登録情報（UIコンポーネントを参照するため components/ 側に置く）
  tools/json-formatter.tsx, char-counter.tsx, id-generator.tsx   # 'use client'
lib/                    # React に依存しないロジック
  tools/json-format.ts, char-count.ts, id-generate.ts         # 純粋ロジック
  storage.ts            # localStorage の安全なラッパー
```

### 3. ツールレジストリ（追加手順の要）
`components/tools/registry.ts` に配列で定義する。

```ts
type ToolDefinition = {
  slug: string // URL: /tools/<slug>
  name: string
  description: string
  storage: 'none' | 'localStorage'
  component: ComponentType
}
export const tools: ToolDefinition[] = [...]
export function getTool(slug: string): ToolDefinition | undefined
```

- 配置: 各ツールの UI コンポーネントを参照するため、React に依存しない `lib/` ではなく `components/tools/` に置く。
  - 代替案: メタデータ（`lib/`）とコンポーネント対応表（`components/`）に分割 → 追加時に2ファイル編集が必要になり「1エントリ追加」の手順が崩れるため不採用。

- 一覧（`app/page.tsx`）、ナビ（`ToolNav`）、動的ルート（`app/tools/[slug]/page.tsx`）はすべてこの配列から生成する。
- 動的ルートは `generateStaticParams` で全 slug を静的生成する。未登録 slug は、ページ内で `getTool(slug)` が `undefined` のときに `notFound()` を呼んで 404 にする。`generateMetadata` でツール名を `<title>` に設定する（未登録 slug では同様に `notFound()`）。`params` は Promise なので `await` する。
  - 代替案: `dynamicParams = false` → Cache Components（create-next-app の既定）有効時は使えないため不採用。Cache Components を無効にしてまで使う理由はない。
- **404 ステータスは `proxy.ts` で返す**: Cache Components ではシェル送信後にページ内の `notFound()` が走るため、404 ページは表示されてもステータスは 200 のままになる（公式ドキュメントの挙動）。仕様どおり本当の 404 を返すため、リポジトリ直下の `proxy.ts`（matcher: `/tools/:slug`）でレンダリング前に `getTool(slug)` を照合し、未登録ならどのルートにも一致しないパス（`/__not-found`）へ rewrite して `app/not-found.tsx` を 404 で返す。slug の照合元はレジストリのまま（単一の情報源を維持）。ページ内の `notFound()` は保険として残す。
  - 代替案: 200 + noindex（soft 404）を許容 → 仕様の「404 ページを返す」を満たさないため不採用。Cache Components を無効化 → create-next-app 既定から外れるため不採用。
- **新ツール追加手順**: ① `lib/tools/<name>.ts` にロジック ② `components/tools/<tool-slug>.tsx` にUI ③ `components/tools/registry.ts` にエントリ追加。各ステップでテストも追加する。これ以外のファイル変更を不要に保つ。
- 代替案: ツールごとに `app/tools/<slug>/page.tsx` を個別作成 → 一覧・ナビとの二重管理になり spec「単一のツール登録情報から生成」に反するため不採用。
- registry はサーバーコンポーネントから import されるが、`component` はクライアントコンポーネント参照を渡すだけなので問題ない。ただし `ToolNav`（client）には `component` を含まない `{slug,name}` だけを props で渡す。

### 4. ロジックとUIの分離
- `json-format.ts`: `formatJson(input, indent: 2 | 4 | 'tab')` / `minifyJson(input)` が `{ok:true, output} | {ok:false, error, line?, column?}` を返す。`JSON.parse` のエラーメッセージから位置（`position N` / `line N column M`）を抽出できたときだけ行列を付ける（ブラウザ差異があるため任意扱い）。
- `char-count.ts`: `countText(text)` → `{chars, charsNoSpace, lines, bytes}`。文字数は `Intl.Segmenter`（granularity: grapheme）、バイト数は `new TextEncoder().encode(text).length`、空白除外は `/\s/u`（全角スペースを含む）で判定。
- `id-generate.ts`: UUID は `crypto.randomUUID()`。パスワードは `crypto.getRandomValues` で棄却サンプリング（`Uint32` を charset 長の倍数未満に制限）して偏りを除去し、各選択文字種から1文字を確保した後、Fisher–Yates（同じく安全な乱数）でシャッフル。
  - 記号セット: ``!@#$%^&*()-_=+[]{};:,.?/`` （シェルや区切りで扱いにくい引用符・バックスラッシュ・空白は除外）

### 5. localStorage ラッパー
`lib/storage.ts` に `readJson<T>(key, validate, fallback)` / `writeJson(key, value)` を置き、すべて try/catch で包む。UI からの読み込みは `useSyncExternalStore`（サーバーとハイドレーション時は既定値、ブラウザでは保存値。localStorage に書けない環境ではメモリ上の値で設定変更を効かせる）で行い、`useEffect` 内で setState する方式は React Hooks の lint ルール（`react-hooks/set-state-in-effect`）に反するため採らない。検証関数で長さ範囲・型をチェックし不正なら既定値。キーは `toolbox:id-generator:password-options` のように `toolbox:<slug>:<name>` 形式で名前空間を切る。

### 6. スタイリング
Tailwind ユーティリティのみ。`prefers-color-scheme` 追従の `dark:` バリアントを使用（切替UIはなし）。レイアウトは `max-w-5xl mx-auto px-4`、ナビは md 以上で横並び／モバイルでは横スクロール可能な帯ではなく折り返し表示にしてページ横スクロールを防ぐ。

### 7. テスト: Vitest + React Testing Library
- 依存: `vitest`、`@vitejs/plugin-react`、`jsdom`、`@testing-library/react`、`@testing-library/dom`、`@testing-library/user-event`、`@testing-library/jest-dom`。
- `vitest.config.mts` で既定環境を `node`、`resolve.tsconfigPaths: true`（Vite 標準機能）で `@/*` を解決し、セットアップファイル `vitest.setup.ts` で `@testing-library/jest-dom/vitest` を読み込む。コンポーネントテストはファイル先頭の `// @vitest-environment jsdom` で jsdom に切り替える。
- `package.json` に `"test": "vitest run"`、`"test:watch": "vitest"` を追加。
- テストは対象ファイルと同じ場所に置く（`lib/tools/char-count.test.ts`、`components/tools/char-counter.test.tsx`）。
- 範囲:
  - **ユニット**: `lib/tools/*`・`lib/storage.ts` の全 spec シナリオ（`localStorage` は `vi.stubGlobal` でスタブ／例外送出、乱数は件数・形式・文字種の性質をテスト）
  - **コンポーネント**: 各ツールUI、`ToolNav`（`next/navigation` の `usePathname` を `vi.mock`）、`CopyButton`（`userEvent.setup()` のクリップボードスタブ、失敗ケースは `navigator.clipboard.writeText` を reject させる）
  - **レジストリ整合性**: slug の一意性・kebab-case、全エントリに name/description/component があること
- async サーバーコンポーネント（`app/tools/[slug]/page.tsx`）は Vitest が非対応のため、静的生成と 404 の表示は `npm run build` の出力と `npm run start` での確認で検証する。`proxy.ts` の振り分けは `next/experimental/testing/server` で単体テストする（`proxy.test.ts`）。
- 代替案: Jest → Next.js + TypeScript + ESM の設定が Vitest より重く、実行も遅いため不採用。

## Risks / Trade-offs

- [jsdom は `Intl.Segmenter` やレイアウトを完全には再現しない] → 文字数ロジックは `node` 環境でユニットテストし、コンポーネントテストは表示・操作の結線確認に絞る。360px 表示は手動確認。

- [`JSON.parse` のエラーメッセージはブラウザごとに形式が異なる] → 行列抽出は任意とし、取れない場合はメッセージ本文のみ表示（spec も「取得できる場合」に限定）。
- [`Intl.Segmenter` 未対応の古いブラウザ] → 主要モダンブラウザは対応済み。未対応時は `Array.from(text).length`（コードポイント数）にフォールバック。
- [`crypto.randomUUID` は安全なコンテキスト（HTTPS / localhost）でのみ利用可] → 本番は HTTPS 前提。未定義時は `getRandomValues` で v4 を組み立てるフォールバックを用意。
- [クリップボード API が使えない環境] → 失敗時は「コピーできませんでした」を表示し、出力欄は選択可能なままにする。
- [create-next-app の既定構成が将来変わる] → 生成時点の既定に従い、生成後の lint/build 成功を完了条件にする。
- [Cache Components 有効時、動的な `params` へのアクセスに `<Suspense>` が求められる場合がある] → `generateStaticParams` で全 slug を列挙してビルド時に検証させる。レイアウトで `usePathname` を使う `ToolNav` は未登録 slug で中断するため、`<Suspense>` で囲み、現在地の強調なしのナビをフォールバックにする。
- [`proxy.ts` がレジストリ（UI コンポーネントを含む）を import する] → ビルドと動作を確認済み。Proxy のバンドルが重くなる・制約に触れる場合は、slug 一覧をレジストリから導出する軽量モジュールに切り出す。
- [生成された AGENTS.md と AGENTS_bk.md の記述が食い違う] → 生成物を優先し、食い違いを統合タスクで報告する。

## Migration Plan

新規作成のため移行・ロールバックは不要。
