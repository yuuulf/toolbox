# Proposal

## Why

Markdownプレビューは「保存」を押したときだけ入力を保存するため、押し忘れると再読み込みやタブを閉じたときに書いた内容が消える。チェックリストなどほかのツールは操作のたびに自動で保存しているので、Markdownプレビューも自動保存にそろえ、保存ボタンをなくす。

## What Changes

- **BREAKING（操作の変更）** Markdownプレビューの保存ボタンをなくし、入力を自動で保存する
  - 入力が止まってから約0.5秒後に保存する（打鍵のたびには書き込まない）
  - ページを閉じる・再読み込みする・ほかのツールへ移るときは、待たずにその時点の入力を保存する
  - 保存できるのは今までどおり1件だけで、前の内容を置き換える。保存先のキーも変えないので、今までに保存した内容はそのまま読み込まれる
  - 保存に成功したときは何も表示しない
  - 保存できなかったとき（localStorage が使えない・容量を超えたなど）は、見えている欄の見出しに「自動保存できません。再読み込みすると入力が消えます。」を表示し、読み上げる。後で保存できたら消す
- 保存ボタンの部品（`SaveButton`）と、それだけが使っていたアイコン（保存・✓・×）を削除する
  - 共通のアイコンボタンの約束（toolbox-shell の spec と AGENTS.md）から「保存」を外し、「追加・削除」だけにする

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `tool-markdown-preview`: 「ボタンを押したときだけ保存する」を、「入力を自動で保存する」に置き換える
- `toolbox-shell`: 「追加・削除・保存はアイコンのみのボタンで提供する」から保存を外す

## データ保存

- Markdownプレビュー: localStorage（`toolbox:markdown-preview:draft`、Markdown 1件）。キーと形式は変えず、保存のタイミングだけを「ボタンを押したとき」から「入力したとき（自動）」に変える
- ほかのツール: 変更なし

## Out of scope

- 複数の下書きの保存や、保存の履歴・元に戻す機能
- 保存に成功したことの表示（「保存しました」など）
- ほかのツールの保存のしかたの変更
- 表示の切り替え（並べて表示など）の保存

## Impact

- `components/tools/markdown-preview/markdown-preview.tsx`（+テスト）
- `components/save-button.tsx`・`save-button.test.tsx` の削除、`components/icons.tsx`・`icons.test.tsx` から保存・✓・× のアイコンを削除
- AGENTS.md の構成図と UI の約束、README.md のツール一覧とデータの扱い
- `openspec/specs/tool-markdown-preview/spec.md` の Purpose の文（「保存」を押したときだけ → 自動で保存）
- 依存パッケージの追加はなし
