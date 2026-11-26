# Design

## Context

- Markdownプレビュー（`components/tools/markdown-preview/markdown-preview.tsx`）は、入力欄とプレビューの各欄の見出しの行（`PaneHeader`）に操作を置いている。自動保存できないときの文言は入力欄の見出し（「プレビューのみ」ではプレビューの見出し）に、表示の切り替えはプレビューの見出し（「入力のみ」では入力欄の見出し）に置く
- 入力欄の値 `markdown` は即時の値、プレビューには `useDeferredValue` の値を渡している
- 操作のアイコンは `components/icons.tsx`（24×24 の線のアイコン、`data-icon` で識別）、アイコンのみのボタンは `IconButton`（`primary` / `subtle`）
- static export で配信するため、ファイルはブラウザ内で作るしかない（データ方針でもある）

## Goals / Non-Goals

**Goals:**
- ファイル名の決め方を `lib/` の純粋関数にし、node 環境でテストできるようにする
- 既存の見出しの行のレイアウトを崩さずにボタンを足す

**Non-Goals:**
- ダウンロード処理の共通化（`hooks/` や `lib/download.ts`）。使うのはこのツールだけなので、2か所目が出たときに切り出す

## Decisions

### D1. ファイル名は `lib/tools/markdown-preview.ts` の `toMarkdownFileName(markdown)` で作る

- 行ごとに見て、` ``` ` / `~~~` で始まる行でコードブロックの内外を切り替え、外側で最初に `^ {0,3}#[ \t]+(.+)$`（または `#` だけの行は空の見出し）に一致した行を見出しとする。末尾の閉じの `#`（` ##` など）は取り除く
- 見出しの文字から `\ / : * ? " < > |` と制御文字（U+0000–U+001F, U+007F）を取り除き、前後の空白と末尾のピリオドを除いて、`MAX_FILE_NAME_LENGTH = 100` 文字（コードポイント単位。サロゲートペアを途中で切らないため `Array.from` で数える）で切る。切った後にもう一度前後の空白と末尾のピリオドを除く
- 空になったら `DEFAULT_FILE_NAME = 'markdown'`。最後に `.md` を付ける
- 見出し中の強調などの記法（`**`、`` ` ``）は取り除かず、そのまま名前に残す（記法を解釈すると構文解析が必要になり、名前としてはそのままでも困らないため）
- 代替案: react-markdown の構文木から見出しを取る → 構文解析をコンポーネント側で二重に行うことになり、`lib/` の純粋関数でなくなるため採らない。Setext 見出し（`タイトル\n===`）は対象外とし、その場合は `markdown.md` になる

### D2. ダウンロードは Blob と `<a download>` で行う

- `new Blob([markdown], { type: 'text/markdown;charset=utf-8' })` から `URL.createObjectURL` で URL を作り、一時的な `<a>` に `href` と `download`（D1 の名前）を付けて `click()` し、すぐに `URL.revokeObjectURL` する。BOM は付けない
- 中身は即時の値 `markdown`（プレビュー用の遅延した値ではない）を使い、押した時点の入力欄と一致させる
- この処理はブラウザ API に触れるので、コンポーネントファイル内の関数（`downloadMarkdown`）に置き、名前を作るロジックだけを `lib/` に置く
- 代替案: `data:` URL → 長い文字列でブラウザの上限にかかることがあるため採らない。File System Access API → 対応ブラウザが限られ、スコープ外

### D3. ボタンは `IconButton` の `subtle` に新しい `DownloadIcon` を付ける

- `components/icons.tsx` に下向きの矢印と受け皿の `DownloadIcon`（`data-icon="download"`）を追加する
- 見出しの行は文字と切り替えだけの軽い見た目なので、塗りつぶしの `primary` ではなく `subtle` にする
- `disabled` は `!ready || markdown.trim() === ''`（保存値を読み終えるまでも押せない）

### D4. ボタンは見えている欄の見出しの行の右端の操作群に1つだけ置く

- 「並べて表示」「入力のみ」では入力欄の見出しに、「プレビューのみ」ではプレビューの見出しに置く（自動保存の文言と同じ規則）。並べて表示で2つ出すと、同じ名前のボタンが重複するため1つにする
- 並びは「自動保存の文言 → 表示の切り替え（あれば） → ダウンロード」とし、操作のボタンを行の右端にそろえる

### D5. ツールの登録手順は変えない

既存ツールの機能追加なので、`components/tools/registry.ts` のエントリは変えない説明文に「.md ファイルとしてダウンロードできます。」を追記するだけにとどめ、README のツール一覧の説明も同じ文言にそろえる。

## Risks / Trade-offs

- [jsdom は `URL.createObjectURL` を持たず、`<a>.click()` で遷移しない] → コンポーネントのテストでは `URL.createObjectURL` / `revokeObjectURL` をスタブし、`HTMLAnchorElement.prototype.click` をスパイして、`download` 属性と Blob の中身（`await blob.text()`）を確かめる
- [iOS Safari などで `download` 属性の扱いが異なる] → 新しいタブで中身が開く場合がある。最終確認で主要ブラウザ（Chrome・Safari）の動作を見る
- [見出しの記法がファイル名に残る（`**重要**.md`）] → D1 のとおり許容する。必要になれば計画を更新する
