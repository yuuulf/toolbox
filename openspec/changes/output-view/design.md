# Design

## Context

- JSON整形/検証の出力は `<textarea readOnly rows={24}>`（`lg:flex-1` で入力欄と同じ高さに伸びる）。UUID の生成結果は `<textarea readOnly rows={件数}>`（スマートフォン幅では `max-h-105` で止め、広い画面では `lg:min-h-114 lg:contain-size` の枠の高さまで伸ばす）。パスワードは `<input type="text" readOnly>`。どれも `<label htmlFor>` で名前を付け、背景は `bg-zinc-50` / `dark:bg-zinc-900`
- Markdownプレビューの表示欄は、見出し `<h2>プレビュー</h2>` と、`<div role="region" aria-label="プレビュー" tabIndex={0}>`（`overflow-y-auto`）の組み合わせ。これが今回そろえる「形式」
- 既存のテストは `getByLabelText('出力')` などで欄を取り、`.value` / `.rows` で中身と行数を確かめている

## Goals / Non-Goals

**Goals:**

- 3つの欄を1つの共通コンポーネントで表示し、見た目とアクセシビリティを統一する
- 高さ・スクロールのふるまいと、1470×800 で縦スクロールが出ない配置を今のまま保つ

**Non-Goals:**

- Markdownプレビューを共通コンポーネントに置き換えること（中身が Markdown の描画で、等幅の文字列ではないため）

## Decisions

### D1. 共通コンポーネント `OutputView`（`components/output-view.tsx`）

3か所（2ツール）で使うため `components/` に置く。描画するのは表示欄だけで、見出しとコピーボタンの行は呼び出し側に残す（JSON整形では見出しの行にコピーボタンが並ぶなど、行の作りがツールごとに違うため）。

```tsx
<div role="region" aria-labelledby={labelId} tabIndex={0}
     className="overflow-auto whitespace-pre rounded-md border ... bg-zinc-50 p-2 font-mono text-sm dark:bg-zinc-900 ...">
  {value}
</div>
```

- props: `value: string`、`labelId: string`（見出しの id）、`className?: string`（高さの指定は欄ごとに違うので呼び出し側から渡す）
- 名前は、見える見出しの `id` を `aria-labelledby` で参照して付ける。Markdownプレビューは `aria-label` だが、見出しと同じ文字を2か所に書かないよう `aria-labelledby` を使う（読み上げ結果は同じ）
- `whitespace-pre` で改行・タブ・連続する空白をそのまま表示し、`overflow-auto` で縦横どちらにもスクロールできるようにする。長いパスワード（最大 128 文字）は折り返さず横にスクロールする
- `tabIndex={0}` でキーボードからフォーカスしてスクロールできるようにする（Markdownプレビューと同じ理由）
- 空でも1行分の高さが残るよう、`min-h` を1行分（`text-sm` の行の高さ + 上下の余白 + 枠）にする
- 背景は今の出力欄と同じ `bg-zinc-50` / `dark:bg-zinc-900` を保ち、入力欄（透明の背景）と見分けやすくする
- 代替: `disabled` の textarea → 編集できそうには見えないが、一部の選択・キーボードでのスクロール・読み上げ（「利用不可」）を失う。ユーザーとの相談で、プレビューと同じ形式に決めた
- 代替: `readOnly` のまま `caret-transparent resize-none` → 見た目は近づくが、スクリーンリーダーには編集欄（読み取り専用）として伝わり、「入力欄に見える」問題が読み上げでは残る

### D2. 見出しは `<label>` から見出し要素に変える

`<label>` は入力欄にしか結び付けられないため、表示欄の名前の元は見出しにする。

- JSON整形/検証: 入力欄の `<label>入力</label>` と並ぶので、見た目は今と同じ `text-sm font-medium` の `<h2 id>出力</h2>`（ツールのページの `<h1>` の下で、Markdownプレビューの「プレビュー」と同じ階層）
- UUID/パスワード生成: 各ブロックの見出しが `<h2>UUID v4</h2>` / `<h2>パスワード</h2>` なので、その下の `<h3 id>生成結果</h3>` / `<h3 id>生成したパスワード</h3>`（見た目は今と同じ `text-sm font-medium`）
- id は `useId()` で作る（今の `outputId` をそのまま使う）

### D3. 高さの指定は今の値を引き継ぐ

| 欄                 | スマートフォン幅                               | 広い画面（lg）                                                                     |
| ------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| JSON の出力        | 入力欄（`rows={24}`、498px）と同じ固定の高さ `h-124.5` | `lg:h-auto lg:min-h-0 lg:flex-1`。列に `lg:contain-size` を付け、出力の長さで列が伸びないようにする |
| UUID の生成結果    | 中身（件数）の高さ。`max-h-105` で止める        | 今と同じ `lg:min-h-114 lg:contain-size` の枠の中で、中身の高さのまま伸び、`lg:max-h-none lg:min-h-0` で枠に収まるまで縮む |
| パスワード         | 1行分                                          | 1行分                                                                              |

- textarea の `rows` による「件数に合わせて行が増える」は、`<div>` では中身の高さがそのまま欄の高さになるので、指定なしで同じふるまいになる。`UUID_ROWS_MIN` は不要になるので消す
- JSON の列の `lg:contain-size` は、Markdownプレビューの列と同じ方法。最低の高さは入力欄の列の高さに引っ張られるので、`rows={24}` の入力欄と並んだとき、今と同じ高さになることを 1470×800 のスクリーンショットで確かめる

### D4. テスト

- `components/output-view.test.tsx`（新規）: 見出しの名前で `getByRole('region', { name })` が取れる、textbox ではない、`tabIndex` が 0、改行とタブを含む値が `textContent` にそのまま入る
- `json-formatter.test.tsx` / `id-generator.test.tsx`: 欄の取り方を `getByRole('region', { name: '出力' })` などに、`.value` を `.textContent` に変える。`queryByRole('textbox', { name: '出力' })` が `null` であることを確かめるテストを足す
- `id-generator.test.tsx` の「生成結果の欄は…件数に合わせて行が増える」（`.rows` を確かめる）は、`rows` がなくなるので、「生成結果は1行に1件ずつ表示する」（`textContent` の行数が件数と一致）に置き換える。高さそのものは jsdom で測れないので、スクリーンショットで確かめる
- 文字カーソルが出ないこと、一部の選択とコピー、キーボードでのスクロール、1470×800 での配置は、ビルド版のブラウザで確かめる（tasks の最終グループ）

## Risks / Trade-offs

- [スクリーンリーダーで、テキスト欄のときのように1文字ずつ読む操作ができなくなる] → 表示領域の中の文字は読み上げの通常の操作で読める。Markdownプレビューと同じ扱い
- [`aria-labelledby` の参照先の id を間違えると名前が付かない] → テストで `getByRole('region', { name })` を確かめる
- [Chrome では、スクロールできる領域が `tabIndex` なしでもフォーカスできる] → `tabIndex={0}` を明示しておけば、ブラウザによらず同じふるまいになる
