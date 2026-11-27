# Proposal

## Why

Markdownプレビューで書いた内容を残す方法は、localStorage に1件だけ自動で保存するものと、手でコピーするものしかない。書いた Markdown をそのまま .md ファイルとして手元に保存できるようにし、ほかのエディタやリポジトリへ持ち出しやすくする。

## What Changes

- Markdownプレビューに、入力中の Markdown を .md ファイルとしてダウンロードするアイコンのみのボタン（名前とツールチップは「Markdown をダウンロード」）を追加する
- ファイル名は、Markdown の最初のレベル1見出し（`# 見出し`）の文字から作る（例: `タイトル.md`）。見出しがない、またはファイル名に使える文字が残らないときは `markdown.md` にする
- 中身は入力欄の内容そのまま（UTF-8）。ファイルはブラウザ内で作り、サーバーや外部サービスへは送らない
- 入力が空（空白だけを含む）のときはボタンを押せない
- ボタンは見えている欄の見出しの行に置き、どの表示（並べて表示・入力のみ・プレビューのみ）でも使える
- 操作のアイコンにダウンロードのアイコンを追加する

### データ保存

- Markdownプレビュー: localStorage（入力した Markdown を自動で1件。この変更で保存する内容は変わらない）。ダウンロードしたファイルの保存先は利用者のブラウザのダウンロード先で、アプリは保持しない

## Out of scope

- プレビュー（HTML）や図（SVG / PNG）のダウンロード
- ファイル名を入力・編集する欄
- .md ファイルの読み込み（アップロード）
- ほかのツールへのダウンロード機能の追加
- 保存場所を選ぶダイアログ（File System Access API）

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `tool-markdown-preview`: 入力した Markdown を .md ファイルとしてダウンロードする要求を追加する

## Impact

- `lib/tools/markdown-preview.ts`（ファイル名を作る純粋関数）とテスト
- `components/tools/markdown-preview/markdown-preview.tsx`（ボタンの配置とダウンロード処理）とテスト
- `components/icons.tsx`（ダウンロードのアイコン）とテスト
- `components/tools/registry.ts` の説明文（ダウンロードできることを追記。エントリの追加はなし）と README.md のツール一覧の説明・データの扱い
- 依存パッケージの追加なし（Blob と `<a download>` のブラウザ標準 API を使う）
