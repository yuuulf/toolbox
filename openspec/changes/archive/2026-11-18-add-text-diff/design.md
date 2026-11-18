# Design

## Context

- ツールの追加は「`lib/tools/<name>.ts` → `components/tools/<tool-slug>…` → `components/tools/registry.ts` に1エントリ」で行う（AGENTS.md）。この change も同じ手順を守る。
- 既存の入力系ツール（JSON整形/検証・文字数カウント）は `textarea` に `<label>` を付け、保存しない。文字数カウントは入力と同時に結果を更新し、書記素の分割に `Intl.Segmenter` を使っている（`lib/tools/char-count.ts`）。
- 1470×800 で縦スクロールなし（toolbox-shell）。ヘッダー・ナビ・見出し・説明・余白でおよそ 230px 使うので、ツールに使えるのは約 520px。
- 依存パッケージは増やさない（AGENTS.md）。差分のライブラリ（`diff` など）は使わず実装する。

## Goals / Non-Goals

**Goals:**

- 差分の計算は `lib/` の純粋関数にし、表示用の「行の組」の並びまで作ってテストで固める。コンポーネントは入力の状態と表示だけを持つ

**Non-Goals:**

- 最小の差分よりも人に読みやすい差分を優先する調整（patience diff や、意味のまとまりでの整列）

## Decisions

### D1. 差分は Myers のアルゴリズム（O(ND)）で、行と書記素の両方に使う

`lib/tools/text-diff.ts` に、2つの配列の差分を「共通・削除・追加」の並びで返す汎用の関数 `diffSequences<T>(a, b)` を置く。行の比較（文字列の配列）と、組になった行の中の文字の比較（書記素の配列）の両方で使う。

- Myers の方式は、差分の量 D が小さいときに速い。テキストの比較はたいてい D が小さい。
- 検討した他の方法: 単純な LCS の表（O(NM)）。5,000 行どうしでは 2,500 万マスになり、メモリも時間も多すぎるので採らない。
- 書記素の分割は `char-count.ts` と同じく `Intl.Segmenter`（ないときはコードポイント）を使う。共通の関数 `splitGraphemes` を `char-count.ts` から export して使い回す。

### D2. 表示用の行モデル

`compareTexts(before, after)` が次の結果型を返す。

```ts
type Segment = { text: string; changed: boolean }
type Side = { lineNumber: number; segments: Segment[] }
type DiffRow =
  | { kind: 'equal'; before: Side; after: Side }
  | { kind: 'changed'; before: Side; after: Side } // 組になった行
  | { kind: 'removed'; before: Side }
  | { kind: 'added'; after: Side }
type CompareResult =
  | { ok: true; rows: DiffRow[]; identical: boolean }
  | { ok: false; reason: 'empty' | 'too-many-lines' }
```

- テキストは `\n` で分割する（`textarea` の値は改行が `\n` にそろっている）。`'a'` と `'a\n'` は `['a']` と `['a', '']` になり、末尾の空行の追加として現れる（spec のとおり）。
- 行の差分で連続した「削除の並び」と「追加の並び」（どちらが先でも）を1つの塊とし、先頭から同じ数だけ `changed` の組にする。余った行は `removed` / `added` にする。組の中で D1 の文字差分を行い、変わった書記素の連なりを `changed: true` の Segment にまとめる。
- 組の行のどちらかが 1,000 書記素（`MAX_LINE_GRAPHEMES`）を超えるときは、文字差分をせず行全体を `changed: true` の1つの Segment にする。
- どちらかが 5,000 行（`MAX_LINES`）を超えるときは `too-many-lines`、両方空のときは `empty` を返す。`identical` は全行が `equal` のとき true。

### D3. 左右表示はグリッド、狭い画面は同じ行モデルから1列を描く

- 結果は `div` のグリッドで描く。1行は「左の行番号・左の内容・右の行番号・右の内容」の4列。`changed` / `removed` / `added` の片側がないときは、その側を空のセルにする。
- 長い行は折り返す（`whitespace-pre-wrap break-all`）。左右の高さは行ごとにそろう（グリッドの同じ行に置くため）。
- 640px 未満（`sm` 未満）では、同じ `rows` から1列の表示を作る。`equal` は1回、`changed` は削除の行の後に追加の行、`removed` / `added` はそのまま。左右表示を `hidden sm:grid`、1列表示を `sm:hidden` で切り替える。`display: none` の側は読み上げにも出ない。
- 検討した他の方法: `<table>`。セルの折り返しと狭い画面の切り替えがグリッドより書きにくく、行の意味（表の見出しなど）も薄いので採らない。

### D4. 色以外の手がかりと読み上げ

- 行頭の記号を表示する（追加 `+`、削除 `-`、共通は空白）。記号は `aria-hidden` にし、代わりに `sr-only` で「追加」「削除」を置く。
- 変わった文字は、消えた文字を `<del>`（取り消し線 + 赤系の背景）、加わった文字を `<ins>`（下線 + 緑系の背景）で囲む。行全体の背景も、削除は赤系、追加は緑系の薄い色にする。色は Tailwind の既定のスケール（`red-50`/`red-200`、`green-50`/`green-200`、ダークは `red-950`/`red-900`、`green-950`/`green-900` など）から選ぶ。
- 行番号は `aria-hidden` にする（読み上げでは内容を優先する）。
- 空・同一・上限超えの文言は、結果欄の上の `aria-live="polite"` の領域に出す。差分の表そのものは `aria-live` にしない（入力のたびに長い表が読み上げられないように）。

### D5. 入力と同時の更新は `useDeferredValue` で重さを逃がす

`TextDiff` コンポーネントは2つの入力値を `useState` で持ち、`useDeferredValue` で遅らせた値から `compareTexts` を計算する（`useMemo`）。入力欄への反映は即時で、差分の計算と描画は React が後回しにできるので、大きな入力でも打鍵が止まりにくい。

### D6. 画面の配置（1470×800 に収める）

- 上段に「変更前」「変更後」の `textarea` を `lg` 以上で2列に並べる（各 `rows={8}`、等幅フォント、`spellCheck={false}`）。それ未満では縦に並べる。
- 下段に案内の文言と結果欄。結果欄は `max-h-64`（256px）で中をスクロールする。概算で 230（周り）+ 200（入力）+ 16 + 24（案内）+ 256 = 726px で 800px に収まる。実装後に実測で確かめる。
- ファイルは `components/tools/text-diff/text-diff.tsx`（`TextDiff`。入力と状態）と `diff-view.tsx`（`DiffView`。左右表示と1列表示）に分ける。`DiffView` は行の部品が多く、150 行を超えそうなため。

## Risks / Trade-offs

- [Myers は最小の差分を返すが、人の見方と違う組み合わせになることがある（例: 空行や `}` だけの行で揃ってしまう）] → 今回は最小の差分で十分とし、patience diff などは対象外。
- [削除と追加を先頭から順に組にするため、行の並べ替えでは関係のない行どうしが組になり、文字の強調が多くなる] → 組にした行でも行全体の背景で変更が分かるので、読み違えは起きにくい。
- [5,000 行どうしで大きく違うと、D が大きくなり計算が重い] → `useDeferredValue` で入力は止めない。上限の 5,000 行は、手元で 5,000 行どうしの最悪に近い比較が許容できる時間（目安 1 秒未満）で終わるかを実装時に測り、超えるなら上限を下げる提案をする。
- 実装後の実測（本番ビルド、ヘッドレス Chrome、ほぼ全行が違う最悪に近い入力）:
  - `compareTexts` の計算: 5,000 行どうしで約 250ms
  - 1文字入力してから画面に反映されるまで: 1,000 行で約 50ms、2,000 行で約 130ms、5,000 行で約 350ms
  - 画面は止まらないので、上限は 5,000 行のままにした（ユーザーと相談して決定）。よくある「1割の行を変更」の場合は 5,000 行でも計算が約 20ms
- [左右表示と1列表示を両方描くので DOM が倍になる] → 片方は `display: none` で描画と読み上げの負担は小さい。上限 5,000 行で現実的な範囲。

## Open Questions

なし
