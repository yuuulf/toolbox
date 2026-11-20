# Design

## Context

- 配色は Tailwind v4（4.3.3）のユーティリティで書いていて、`app/globals.css` には `@import 'tailwindcss'` と `color-scheme` しかない。ほぼすべてが `zinc` で、青は `markdown-view.tsx` のリンク（`text-blue-700 dark:text-blue-400`）だけ
- チェックボックスは 3 か所（`components/tools/checklist/item-list.tsx`、`components/tools/id-generator.tsx`、Markdownプレビューのタスクリスト）で、どれも色を指定しておらず、ブラウザ既定の色（多くの環境で青）で描かれる。ただしタスクリストは disabled で、ブラウザは disabled のチェックボックスに `accent-color` を使わず灰色で描く（今も青ではないので、対象外のままにする）
- AGENTS.md は「色は Tailwind の既定スケールを使い、任意値（`text-[#00796b]` など）は避ける」としている。Tailwind の `teal` は #009688 と別の色なので、既定スケールではこの色を出せない

## Goals / Non-Goals

**Goals:**

- アクセント色を1か所で定義し、ユーティリティクラスで使えるようにする
- チェックボックスの色は個々の `<input>` に書かず、今後追加するフォーム部品にも自動で効くようにする

**Non-Goals:**

- ボタンやナビなど、zinc の部分の色の見直し（proposal の Out of scope）
- 色をユーザーが切り替える機能

## Decisions

### D1. `@theme` に `accent` 色のスケールを追加する

`app/globals.css` に Tailwind v4 の `@theme` で次の3色を定義する。

| トークン                     | 値      | 用途                                         |
| ---------------------------- | ------- | -------------------------------------------- |
| `--color-accent-300`         | #4db6ac | ダークの文字・チェックボックス               |
| `--color-accent-500`         | #009688 | 基準色。ライトのチェックボックス             |
| `--color-accent-700`         | #00796b | ライトの文字（リンク）                       |

これで `text-accent-700`、`accent-accent-500` のようなユーティリティが使える。番号は Tailwind の既定スケールの明るさの並び（小さいほど明るい）に合わせる。

- 代替: `text-[#00796b]` の任意値 → AGENTS.md の規約に反し、同じ値が散らばる
- 代替: Tailwind の `teal-*` を使う → #009688 と色相・明るさが違い、指定の色にならない
- 名前を `accent` にしたのは、ユーザーの言う「アクセント」と一致させるため。CSS の `accent-color` のユーティリティ名と重なり `accent-accent-500` となるが、それぞれの意味（プロパティ名と色名）は明確なので許容する

コントラスト比（WCAG 2 の相対輝度で計算）:

| 組み合わせ                      | 比     | 基準            |
| ------------------------------- | ------ | --------------- |
| #00796b / 白                    | 5.32   | 文字 4.5 を満たす |
| #00796b / `zinc-50`（表の見出し） | 5.10   | 文字 4.5 を満たす |
| #4db6ac / `zinc-950`            | 8.15   | 文字 4.5 を満たす |
| #4db6ac / `zinc-900`（コード枠）  | 7.26   | 文字 4.5 を満たす |
| #009688 / 白                    | 3.67   | 非テキスト 3 を満たす（文字には使わない） |

### D2. チェックボックスの色は `<body>` の `accent-color` で一括指定する

`app/layout.tsx` の `<body>` に `accent-accent-500 dark:accent-accent-300` を加える。`accent-color` は継承されるので、3 か所のチェックボックスと今後のフォーム部品に一括で効く。チェックマークの色（白/黒）はブラウザが塗りの色に合わせて選ぶ。

- 代替: 各 `<input type="checkbox">` にクラスを付ける → 付け忘れが起きる。Markdown のタスクリストは react-markdown が出力するため、コンポーネントの差し替えも必要になる
- 代替: `globals.css` に `:root { accent-color: ... }` を書く → ダークの切り替えに独自のメディアクエリが要る。Tailwind の `dark:` で書けるならそちらを使う（AGENTS.md の方針）

### D3. リンクの色はクラスの置き換えだけ

`markdown-view.tsx` の `text-blue-700 underline dark:text-blue-400` を `text-accent-700 underline dark:text-accent-300` にする。下線は残し、色だけに頼らずリンクとわかるようにする。

### D4. テスト

- `markdown-view.test.tsx` に、リンクがアクセント色のクラス（`text-accent-700` と `dark:text-accent-300`）を持ち、`blue` のクラスを持たないことを確かめるテストを追加する。jsdom は Tailwind の CSS を解釈しないため、計算後の色ではなくクラスで確かめる
- `<body>` のクラスと実際の描画色は単体テストでは確かめられないので、開発サーバーでライト・ダークのスクリーンショットを撮って目で確認する（tasks の最終グループ）

## Risks / Trade-offs

- [ブラウザによって `accent-color` の効き方が違う（古い Safari は未対応）] → 未対応のブラウザでは既定の色に戻るだけで、操作には影響しない
- [`accent-color` は継承されるため、今後追加する range やラジオボタンもティールになる] → 意図どおり（アクセント色の一貫性）。別の色にしたい部品は個別に上書きする
- [ビルド時に `@theme` のトークンが使われないと CSS に出力されない] → 使う3色はすべてクラスから参照される。ビルド後の `out/` の CSS に `--color-accent-*` が含まれることを確認する
