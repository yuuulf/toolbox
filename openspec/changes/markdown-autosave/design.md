# Design

## Context

- `markdown-preview.tsx` の `Editor` は入力を `markdown` の state に持ち、`SaveButton` を押したときだけ `saveDraft(markdown)`（`lib/tools/markdown-preview.ts`、`writeJson` で成功なら true）を呼ぶ。保存ボタンは入力欄の見出しに置き、「プレビューのみ」のときはプレビューの見出しに置く
- 保存値はブラウザでだけ読めるので、`useSyncExternalStore` で読み終えるまで `ready` を false にし、入力欄を無効にしている。読み終えたら `key` を変えて入力欄を保存値で作り直す
- チェックリストは操作のたびに保存し、失敗しても何も表示しない。エラーの文言の色は `text-sm text-red-700 dark:text-red-400` にそろえている
- `SaveButton` を使うのは Markdownプレビューだけ。`SaveIcon`・`CheckIcon`・`CrossIcon` を使うのも `SaveButton` だけ（`CopyButton` は自前のアイコンを持つ）

## Goals / Non-Goals

**Goals:**

- 入力のたびに数十 KB を localStorage へ書き込まないようにしつつ、ページを離れるときの入力も失わない

**Non-Goals:**

- 保存の処理（`saveDraft` / `loadDraft`）とキー・形式の変更
- ほかのツールでも使える自動保存の共通部品にすること（今は Markdownプレビューだけなので、必要になったら `hooks/` へ移す）

## Decisions

### D1. 自動保存はフック `useAutoSave` にまとめる

- `components/tools/markdown-preview/use-auto-save.ts` に置く。`markdown-preview.tsx` に入れると 150 行を超えるため、同じディレクトリの部品として分ける（このツール専用なので `hooks/` には置かない）
- 引数は保存する値・保存してよいか（`ready`）・保存の関数（`saveDraft`）。戻り値は保存できなかったかどうか（`failed: boolean`）
- 動作:
  - 値が変わるたびにタイマーを `AUTOSAVE_DELAY_MS`（500ms）で張り直し、止まったら1回だけ保存する
  - 最後に保存した値（最初は読み込んだ値）を ref に持ち、同じ値なら保存しない。開いただけでは書き込まない
  - `ready` が false の間は保存しない（読み込む前の空の値で保存値を消さないため）
  - 保存の結果で `failed` を更新する。成功したら false に戻す
- 検討した他の方法: 入力のたびに即時に保存する。いちばん単純だが、長い文書では打鍵ごとに全文を JSON にして書き込むので採らない

### D2. ページを離れるときは待たずに保存する

- まだ保存していない値があれば、次のときにすぐ保存する（タイマーは止める）
  - `pagehide`: タブを閉じる・再読み込み・ほかのサイトへの移動
  - `visibilitychange` で `hidden` になったとき: スマートフォンでアプリを切り替えた後に、`pagehide` なしでページが破棄されることがあるため
  - フックを使うコンポーネントが外れるとき: サイドバーからほかのツールへ移る（クライアント側の遷移で、`pagehide` は起きない）
- 検討した他の方法: `beforeunload`。ブラウザの戻る・進むのキャッシュ（bfcache）を無効にし、スマートフォンでは起きないことがあるので採らない

### D3. 保存できないときの表示

- 文言は「自動保存できません。再読み込みすると入力が消えます。」。色は既存のエラーと同じ `text-sm text-red-700 dark:text-red-400`（文言で伝わるので色は補助）
- 今まで保存ボタンを置いていた場所（入力欄の見出し、「プレビューのみ」ではプレビューの見出し）に置く。見出しの行は折り返せるので、幅が狭いときは2行になる
- `aria-live="polite"` の要素は、失敗していないときも空のまま置いておく（後から文字が入ったときに読み上げられるように）
- 表示は、次に保存に成功するまで残す

### D4. 使わなくなった部品を削除する

- `components/save-button.tsx`・`save-button.test.tsx` を削除する
- `components/icons.tsx` から `SaveIcon`・`CheckIcon`・`CrossIcon` を削除し、`icons.test.tsx` を合わせる
- AGENTS.md: 構成図から `save-button.tsx` を外し、`icons.tsx` の説明を「追加・削除など」にする。UI の約束を「追加・削除は必ずアイコンのみのボタン（`IconButton`）」にする
- 削除した部品が必要になったら、git の履歴（`icon-action-buttons`）から戻せる

### D5. spec の Purpose の文を直す

- `openspec/specs/tool-markdown-preview/spec.md` の Purpose は差分（delta）では変わらないので、同じ PR で「入力内容は localStorage に自動で1件保存する」に直す

## Risks / Trade-offs

- [入力してから0.5秒以内にブラウザが異常終了すると、その分は保存されない] → 通常の終了・再読み込み・遷移は D2 で保存する。異常終了は対象外とする
- [前は「保存」を押した版を残したまま試し書きできたが、自動保存では上書きされる] → 保存は1件だけというユーザーの選択どおり。複数の下書きは Out of scope
- [localStorage の容量を超える長い文書では、毎回失敗の表示が出る] → 表示は1か所で、入力とプレビューは使える。文言で再読み込みすると消えることを伝える
- [開発時の React の StrictMode でコンポーネントが一度外れて付き直すと、外れたときの保存が走る] → 未保存の値がなければ何もしない。あっても同じ値を保存するだけで害はない

## Migration Plan

- 保存のキーと形式は変えないので、今までに「保存」で保存した Markdown は、更新後もそのまま入力欄に読み込まれる
- 戻すときは PR を revert する
