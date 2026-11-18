# Design

## Context

- ツールは「`lib/tools/<name>.ts`（+テスト）→ `components/tools/<tool-slug>`（+テスト）→ `registry.ts` に1エントリ」で追加する
- localStorage は `lib/storage.ts` の `readJson` / `writeJson` を通す。カラーツールのお気に入りは、モジュール内のストアと `useSyncExternalStore` で持ち、サーバーでは空のスナップショットを返している（プリレンダーと hydration の不一致を避けるため）
- ツールページは Cache Components で静的にプリレンダーされる。そのため、レンダー中に `new Date()` で「今日」を決めると、ビルド時の日付が HTML に入ってしまう
- UUID は `lib/tools/id-generate.ts` の内部関数 `randomUuid`（`crypto.randomUUID` がない環境では `getRandomValues` から組み立てる）で作れる
- ツールページの本体は `max-w-5xl`（1024px）で、1470×800 ではツール本体に使える高さが約 550px（fit-tools-in-viewport の design を参照）
- README の「データの扱い」は「保存するのは一部ツールの設定と、カラーツールのお気に入りの色だけ」と書いている。チェックリストの項目は利用者が入力した内容なので、この記述と食い違う

## Goals / Non-Goals

**Goals:**

- 期間の計算・データの操作・古い記録の削除を、React に依存しない純粋関数としてテストできる形にする
- 4つのリストを同じ部品で表示し、繰り返しのリストと一時のリストの違いを最小限にする

**Non-Goals:**

- 日付をまたいで開いたままにしたときの「今日」の自動更新（開いた時点の今日を使う）
- 複数タブ間の同期（あとで書いたタブの内容で上書きされる）

## Decisions

### 1. ファイル構成

```
lib/tools/
  checklist-period.ts     # 期間のキー（月 'YYYY-MM'・週の月曜 'YYYY-MM-DD'・日 'YYYY-MM-DD'）、入力値の検証、週の範囲の表示、保持期間の判定
  checklist.ts            # 型、保存値の検証、項目の追加・削除、チェックの切り替え、チェック済みの削除、古い記録の削除、読み書き
components/tools/checklist/
  checklist.tsx           # Checklist。ストアと「今日」を持ち、4つのリストを並べる
  recurring-list.tsx      # RecurringList。見出し・完了数・期間の入力・項目一覧・追加欄（月次/週次/日次で共通）
  temporary-list.tsx      # TemporaryList。見出し・完了数・項目一覧・追加欄・「チェック済みを削除」
  item-list.tsx           # ItemList。チェックボックスと削除ボタンの一覧（2種類のリストで共通）
  add-item-form.tsx       # AddItemForm。入力欄・「追加」・上限の表示（2種類のリストで共通）
```

`id-generate.ts` の `randomUuid` を export して、項目の ID に使う（同じ処理を二重に持たないため）。registry には `slug: 'checklist'`、`name: 'チェックリスト'`、`storage: 'localStorage'` で登録する。

### 2. 保存の形

キー `toolbox:checklist:data` の1つに、全体を1つの JSON で保存する。1回の操作で項目とチェックを同時に書き換えることがあり（項目の削除など）、キーを分けると片方だけ書けた状態が起こりうるため。

```ts
type ChecklistData = {
  monthly: { items: Item[]; checks: Record<string, string[]> } // キーは 'YYYY-MM'
  weekly: { items: Item[]; checks: Record<string, string[]> }  // キーは週の月曜の 'YYYY-MM-DD'
  daily: { items: Item[]; checks: Record<string, string[]> }   // キーは 'YYYY-MM-DD'
  temporary: { items: (Item & { checked: boolean })[] }
}
type Item = { id: string; text: string }
```

- チェックの状態は、チェック済みの項目 ID の配列として持つ
- 読み込み時の検証では、形・型・期間キーの書式・項目数（30 件以下）・文字数（100 文字以下）を確かめる。満たさなければ、全体を空のデータとして扱う。項目にない ID のチェックは、読み込み時に取り除く
- 純粋関数（すべて新しい値を返す）: `addItem(data, list, text)`、`removeItem(data, list, id)`、`toggleCheck(data, list, periodKey, id)`、`toggleTemporary(data, id)`、`removeCheckedTemporary(data)`、`pruneChecks(data, today)`
  - `addItem` は結果型 `{ ok: true, data } | { ok: false, reason: 'empty' | 'too-long' | 'full' }` を返す
  - 繰り返しのリストで項目を削除したら、その ID を全期間のチェックから取り除く

### 3. 期間と「今日」

- 週は月曜始まり。日付から、その週の月曜の日付をキーにする。月・日はローカル時刻の年・月・日から作る（`toISOString` は UTC になるので使わない）
- 週の範囲は「11/16（月）〜11/22（日）」と表示する。年をまたぐ週でも月/日だけを表示する（年は日付の入力欄で見えるため）
- **「今日」はブラウザでだけ決める。** `useSyncExternalStore` で、サーバーのスナップショットは `null`、ブラウザでは読み込み時の日付を返す。`null` の間（プリレンダーした HTML）は、期間の入力欄と項目一覧を出さずにリストの枠だけを表示する
- 選んでいる期間は、`Checklist` の state（リストごと）に入力値として持つ。初期値は「今日」から作る。保存はしない
- 入力欄が空や不正な値になったとき（日付を消したときや、`<input type="month">` に対応していないブラウザで文字を入れたとき）は、直前に正しかった期間を使い続ける

### 4. 古い記録の削除

- `pruneChecks(data, today)` は、日次は今日から 89 日前より古い日、週次は今週の月曜から 51 週前の月曜より古い週、月次は今月から 23 か月前より古い月のキーを削除する。今日より後のキーは残す
- 保持の期間は名前付き定数にする（`DAILY_RETENTION_DAYS = 90` など）
- ストアの `set` で保存するたびに `pruneChecks(next, new Date())` を通してから書き込む。読み込みのときには削除しない（読み込みだけで保存値を書き換えないため）

### 5. 画面の配置

- `Checklist` のルートは、`lg` で2列、`xl`（1280px 以上。1470 も含む）で4列のグリッドにする。並び順は 月次 → 週次 → 日次 → 一時
- 1470×800 に収めるため、各リストの項目一覧に `max-h-72` と `overflow-y-auto` を付け、項目が多いときは一覧の中でスクロールさせる。見積もり: 見出し 28px＋期間 80px＋追加欄 40px＋一覧 288px＋間隔で約 480px（一時のリストは「チェック済みを削除」ぶん高くなるが、期間の入力がないので同程度）
- 4列のとき1列は約 240px と狭い。そのため、項目のテキストは折り返し、削除ボタンは右端に固定する

### 6. アクセシビリティと UI の約束

- 各項目のチェックボックスには、項目のテキストを `<label>` で結びつける。削除ボタンはアイコン（×）に `aria-label="<項目> を削除"` を付ける
- 追加欄の入力には `sr-only` の `<label>`（「月次の項目」など）を付け、`maxLength={100}` で文字数を制限する。Enter で追加できるよう `<form>` の submit で受ける（ボタンは `type="submit"`。AGENTS.md の「ボタンは `type="button"`」は通常のボタンの約束で、フォームの送信ボタンは例外として扱う）
- 完了数の見た目は `1/3`、読み上げ用には `sr-only` で「3件中1件完了」とする。上限の案内（「項目は30件までです。」）は `aria-live="polite"` で表示する
- 期間の入力には見える `<label>`（「月」「週」「日」）を付ける

### 7. ドキュメント

README の「ツール一覧」に1行追加する。「データの扱い」は、チェックリストの項目とチェック状態を保存すること、古いチェックの記録は自動で削除すること、を書き加える。

## Risks / Trade-offs

- [`<input type="month">` に対応していないブラウザ（Safari のデスクトップ版など）では、テキスト入力になる] → `YYYY-MM` の形式だけを受け付け、それ以外は直前の月を使い続ける。表示は崩れないが、入力しにくい。必要になったら年・月の select に置き換える
- [日付をまたいで開いたままにすると、初期値の「今日」と古い記録の削除の基準がずれる] → 削除は保存のたびに現在時刻で判定するので、記録が残りすぎることはない。初期値は再読み込みで更新される
- [複数のタブで同時に編集すると、あとで保存したタブの内容で上書きされる] → 個人用の小さなツールなので受け入れる（Non-Goals）
- [プリレンダーした HTML では期間と項目が出ず、読み込み直後に表示が切り替わる] → 枠の大きさは同じにして、ずれを小さくする
- [4列の各列が狭い] → 項目のテキストを折り返す。幅 1024〜1279px では2列にする

## Migration Plan

新規ツールの追加だけで、データの移行はない。戻すときはこの change のコミットを revert する（localStorage の `toolbox:checklist:data` は使われなくなるだけで害はない）。
