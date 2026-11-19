# Design

## Context

- `components/copy-button.tsx` の `CopyButton` は、アイコンのみのボタンと、結果をアイコンの切り替え（約2秒）と `sr-only` の `aria-live` で伝える仕組みを持っている。アイコンはファイル内の SVG のパス（24×24、線の太さ 2）で書いている。
- 今のボタン:
  - チェックリストの追加: `add-item-form.tsx`。`<form>` の `type="submit"` の文字のボタン「追加」で、Enter キーでも追加できる。塗りつぶしの見た目
  - チェックリストの項目の削除: `item-list.tsx`。× の SVG のアイコンのボタン。`aria-label` / `title` は「<項目> を削除」
  - お気に入りの削除: `favorite-colors.tsx`。× の SVG のアイコンのボタン。名前は「<HEX> を削除」
  - Markdown の保存: `markdown-preview.tsx`。文字のボタン「保存」と、横の `aria-live` の文言「保存しました。」「保存できませんでした。」。保存の後に入力が変わると文言を消す
- 依存パッケージは増やさない（AGENTS.md）。

## Goals / Non-Goals

**Goals:**

- アイコンと、アイコンのみのボタンの見た目・属性を1か所にまとめ、ツールからは「どの操作か」と「何を対象にするか」だけを渡せば済むようにする

**Non-Goals:**

- `CopyButton` の作り直し（見た目と動作は変えない）
- アイコンのライブラリの導入

## Decisions

### D1. アイコンは `components/icons.tsx` にまとめる

- `PlusIcon`・`TrashIcon`・`SaveIcon`・`CheckIcon`・`CrossIcon` を、今のコピーボタンと同じ書き方の SVG で定義する
  - 書き方: `viewBox="0 0 24 24"`、`stroke="currentColor"`、`strokeWidth={2}`、`aria-hidden`、`focusable="false"`、`size-4`
- ゴミ箱は「ふた・本体・縦の線2本」、保存は「フロッピーディスク」の形にする。どちらも一般的な形で、文字がなくても意味が伝わりやすい
- 検討した他の方法: lucide などのアイコンのライブラリ。5つの形のために依存を増やすほどではないので採らない

### D2. アイコンのみのボタンは `components/icon-button.tsx` の `IconButton`

- props: `label`（アクセシブルな名前とツールチップ）、`icon`、`onClick`、`type`（`button` / `submit`、既定は `button`）、`disabled`、`variant`
- `aria-label` と `title` に `label` を入れる。アイコンは `aria-hidden`
- `variant` で見た目を選ぶ:
  - `primary`: 塗りつぶし。今の「追加」「保存」の見た目
  - `subtle`: 枠なしで薄い色。今の削除の見た目
- 押せないときは今までの文字のボタンと同じく、`disabled` で薄く表示する
- チェックリストの追加は `type="submit"` のまま使い、Enter キーで追加できる動作を変えない

### D3. 保存は `components/save-button.tsx` の `SaveButton`

- props は `onSave: () => boolean`（保存できたら true）と `disabled`
- 押すと `onSave()` を呼び、結果でアイコンを `CheckIcon`（成功、緑）か `CrossIcon`（失敗、赤）に約2秒切り替える。`CopyButton` と同じ時間（2000ms）
- `sr-only` の `aria-live="polite"` に「保存しました」「保存できませんでした」を出す
- 見た目は `IconButton` の `primary` と同じ。切り替え中の色は `CopyButton` と同じく補助で、形（✓ / ×）で区別できる
- Markdownプレビューの、入力が変わったら保存の文言を消す処理（`saveStatus` の state）は不要になるので外す。結果は2秒で元に戻る

### D4. 削除のアイコンをゴミ箱にする

- お気に入りの削除（`favorite-colors.tsx`）と、チェックリストの項目の削除（`item-list.tsx`）を `IconButton`（`subtle`、`TrashIcon`）に置き換える。名前（「<対象> を削除」）は変えない
- チェックリストの項目の削除は、ユーザーが見た目を確かめてから決める（タスク 3.3）。実装後にスクリーンショットで確かめてもらい、ゴミ箱のままにすると決まった。× に戻すと決まったときは:
  - チェックリストだけ `CrossIcon` を渡す
  - spec の「削除はゴミ箱」は、チェックリストを除く形に直す提案をする

### D5. AGENTS.md の約束に加える

- UI の統一の節に「追加・削除・保存は必ず `IconButton` / `SaveButton` を使う（アイコンは `components/icons.tsx`）」を加える
- 構成図に3つのファイルを加える

## Risks / Trade-offs

- [文字がなくなるので、初めて見る人にはアイコンの意味が伝わりにくいことがある] → 一般的な形（+、ゴミ箱、フロッピー）を使い、ポインタを重ねると名前が出るようにする。読み上げでは名前が伝わる
- [チェックリストの各リストに「追加」という同じ名前のボタンが4つ並ぶ] → 今も同じ名前の文字のボタンが4つで、入力欄の名前（「月次の項目」など）で区別できている。変えない
- [保存の結果が2秒で消えるので、後から保存したか確かめられない] → コピーと同じ扱いにそろえる（ユーザーの選択）
