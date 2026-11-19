# Design

## Context

- 依存パッケージは、ブラウザ標準 API で足りないときだけ追加し、理由を計画に残す（AGENTS.md）。このアプリの `dependencies` は今まで `next`・`react`・`react-dom` だけ。
- アプリは static export で GitHub Pages に配信する（toolbox-deployment）。ページはビルド時にプリレンダーされるため、localStorage の値はブラウザで読む（カラーツール・チェックリストと同じ `useSyncExternalStore` の仕組み）。
- 1470×800 で縦スクロールなし（toolbox-shell）。ツールに使える高さは約 520px。
- 計画のときに、作業用ディレクトリに `react-markdown@10.1.0`・`remark-gfm@4.0.1`・`mermaid@12.3.0` を入れて確かめたこと:
  - `react-markdown` は既定で HTML を文字のまま出す（`<script>` は `&lt;script&gt;` になる）。`javascript:` の URL は `href=""` に置き換えられる。
  - 画像はそのまま `<img src>` になり、外部へ通信してしまう。
  - タスクリストは `disabled` のチェックボックスになる。
  - `mermaid` は ESM で、`dist` は約 120MB（図の種類ごとに多くのチャンクに分かれている）。

## Goals / Non-Goals

**Goals:**

- `mermaid` の重さを、このツールで図を表示するときだけに閉じ込める（ほかのページや、図のない Markdown では読み込まない）
- 外部への通信と、入力からのスクリプト実行を起こさない

**Non-Goals:**

- `@tailwindcss/typography` などの追加の依存で Markdown の見た目を整えること（要素ごとのクラスで足りる）

## Decisions

### D1. Markdown は `react-markdown` + `remark-gfm` で React 要素にする

- `react-markdown` は HTML 文字列を作らず React 要素を返すので、`dangerouslySetInnerHTML` が要らない。HTML を解釈しない既定の動作のまま使い、`rehype-raw` は入れない。
- 検討した他の方法:
  - `marked` + `DOMPurify`: HTML 文字列を作ってサニタイズし `innerHTML` で入れる。サニタイズの設定に安全性が依存するので採らない。
  - 自前の Markdown 解析: 表・入れ子のリスト・GFM の細部まで正しく扱うのは大きな作業になるので採らない。
- 要素ごとの見た目は `components` で Tailwind のクラスを付ける（見出し・段落・リスト・表・引用・コード・リンクなど）。`lib/tools/markdown-preview.ts` には、URL の判定などの純粋関数だけを置く。

### D2. 画像は読み込まず、リンクは新しいタブで開く

- `components.img` を差し替え、`<img>` を出さずに「画像: {alt}（{url}）」の文字を表示する。読み込まないので外部への通信は起きない（spec「HTML と画像を読み込まない」）。
- `components.a` を差し替え、`target="_blank"`・`rel="noopener noreferrer"` を付ける。`href` は `react-markdown` の既定の URL 変換（`javascript:` などを空にする）を通った値を使い、空のときはリンクにせず文字だけを出す。

### D3. Mermaid は `code` の差し替えで検出し、動的 import で読み込む

- `components.code` で `className` が `language-mermaid` のブロックを `MermaidDiagram` に渡す（`pre` の中身として）。それ以外のコードブロックは等幅の `pre`/`code` で表示する。
- `MermaidDiagram` は初回の描画で `import('mermaid')` を呼ぶ。読み込みはモジュール内で1回だけにし（Promise を使い回す）、`mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme })` を呼ぶ。`securityLevel: 'strict'` は、図の中のクリック操作や HTML の埋め込みを無効にするため。
- `mermaid.render(id, code)` が返す SVG 文字列を `dangerouslySetInnerHTML` で入れる。SVG は `strict` の設定で Mermaid が中身をサニタイズしたもので、入力の HTML がそのまま入ることはない。
- `render` が例外を投げたら「図を描けませんでした。」とエラーの内容、元のコードを表示する。図ごとに独立しているので、ほかの図や Markdown は表示され続ける。
- `id` は `useId` から作る（`:` を除いた文字列にする。Mermaid が CSS セレクタに使うため）。
- 入力のたびに描き直すと重いので、描画はコードの文字列が変わったときだけ行う。古い描画の結果が後から届いたら捨てる（`useEffect` の後片付けで印を付ける）。

### D4. 図の配色は OS の設定に合わせる

- `matchMedia('(prefers-color-scheme: dark)')` を `useSyncExternalStore` で購読し、ダークなら `theme: 'dark'`、ライトなら `'default'` で描く。設定が変わったら描き直す。
- `mermaid.initialize` はグローバルな設定なので、描く直前に毎回テーマを指定してから `render` する。

### D5. 表示の切り替えは3つのボタンのグループにする

- 「並べて表示」「入力のみ」「プレビューのみ」を `role="radiogroup"` の中の `role="radio"` ボタンにし、`aria-checked` で選択中を示す。見た目でも選択中を塗りつぶしで示す（色だけに頼らない）。矢印キーでの移動は付けず、各ボタンを Tab で移動して Enter / Space で選ぶ（ほかのツールのボタンと同じ操作）。
- 選択は `useState` で持ち、保存しない。入力の内容は表示を切り替えても同じ state のまま残る。
- 「並べて表示」は `lg` 以上で2列のグリッド、それ未満で縦並び。「入力のみ」「プレビューのみ」は片方だけを描き、幅いっぱいにする。

### D6. 保存はボタンでだけ行い、開いたときに復元する

- キーは `toolbox:markdown-preview:draft`、値は文字列1つ。読み書きは `lib/storage.ts` の `readJson` / `writeJson` を使う（検証は `typeof value === 'string'`）。
- 開いたときの復元: 保存値はブラウザでだけ読めるので、`useSyncExternalStore`（サーバーでは `null`）で「読み込み済みかどうか」と保存値を得る。入力欄のコンポーネントは読み込み済みになってから保存値を初期値にして描く（`key` を変えて作り直す）。プリレンダーの HTML では入力欄とプレビューの枠だけを出す。
- 保存の結果は `'saved' | 'failed' | null` の state で持ち、入力が変わったら `null` に戻す。表示は「保存」ボタンの横の `aria-live="polite"` の領域に出す。
- 空の入力で保存すると、空文字列を保存する（次回は空で開く）。

### D7. 画面の配置（1470×800 に収める）

- 上段に表示の切り替えと「保存」ボタン・保存の結果（1行、約 36px）。
- 下段に入力欄とプレビュー。どちらも高さ `h-112`（448px）で中をスクロールする。概算で 230（周り）+ 36 + 16 + 448 = 730px で 800px に収まる。実装後に実測で確かめる。
- ファイル構成（`components/tools/markdown-preview/`）:
  - `markdown-preview.tsx`（`MarkdownPreview`。表示の切り替え・保存・配置）
  - `markdown-view.tsx`（`MarkdownView`。`react-markdown` と要素ごとの見た目）
  - `mermaid-diagram.tsx`（`MermaidDiagram`。動的 import と描画）
  - `view-mode-switch.tsx`（`ViewModeSwitch`）

### D8. テストでの Mermaid の扱い

jsdom では Mermaid の SVG の描画（レイアウトの計算）ができないため、`MermaidDiagram` のテストでは `vi.mock('mermaid')` で `render` を差し替え、「コードを渡して返った SVG を入れる」「例外のときにエラーを出す」「テーマを指定する」ことを確かめる。実際の図は、開発サーバーとビルド結果をブラウザで開いて確かめる。

## Risks / Trade-offs

- [`mermaid` は大きく、`npm ci` とビルドの時間が増える] → ブラウザに送るのは使う図の種類のチャンクだけ。CI の時間が大きく延びたら報告する。
- [依存パッケージの脆弱性の対応が必要になる] → 3つとも広く使われ、更新が続いている。更新は通常の PR で行う。
- [Mermaid の SVG を `dangerouslySetInnerHTML` で入れる] → `securityLevel: 'strict'` で Mermaid がサニタイズする。入力の HTML がそのまま入らないことをテストではなく実際のブラウザで確かめる（`<img onerror>` などを図のラベルに書いて試す）。
- [図の多い長い文書では、入力のたびの描画が重くなる] → 図はコードが変わったときだけ描き直す。Markdown 部分の再描画は軽い。

## Migration Plan

依存の追加なので、`npm install` で `package-lock.json` を更新し、同じコミットに含める。元に戻すときは revert で依存も外れる。
