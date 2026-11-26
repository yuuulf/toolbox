# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `markdown-download`（main から作成する）。依存パッケージは追加しない。

## 1. ファイル名を作るロジック

- [x] 1.1 `lib/tools/markdown-preview.ts` に `toMarkdownFileName(markdown: string): string` と定数 `MAX_FILE_NAME_LENGTH = 100`・`DEFAULT_FILE_NAME = 'markdown'` を追加する（design D1）。`markdown-preview.test.ts` に、最初のレベル1見出しから名前を付ける（`# 議事録 11/26` → `議事録 1126.md`）、`##` だけ・本文だけ・空のときは `markdown.md`、コードブロック（` ``` ` と `~~~`）の中の `#` 行を無視する、閉じの `#` と前後の空白・末尾のピリオドを除く、使えない文字と制御文字を除く、`# ???` は `markdown.md`、100文字を超える名前（絵文字を含む）をコードポイント単位で切る、のテストを追加し、`npm test` が成功することを確認する

## 2. ダウンロードのボタン

- [x] 2.1 `components/icons.tsx` に `DownloadIcon`（`data-icon="download"`、下向きの矢印と受け皿）を追加し、`icons.test.tsx` に `aria-hidden` で `data-icon="download"` の SVG を描くテストを追加して、`npm test` が成功することを確認する（design D3）
- [x] 2.2 `components/tools/markdown-preview/markdown-preview.tsx` に、Blob と一時的な `<a download>` で入力欄の即時の値を `toMarkdownFileName` の名前でダウンロードする処理と、`IconButton`（`label="Markdown をダウンロード"`、`variant="outline"`（2.5）、`icon={<DownloadIcon />}`、`disabled={!ready || markdown.trim() === ''}`）を追加し、見えている欄の見出しの行の操作群の右端に1つだけ置く（design D2・D4）。`markdown-preview.test.tsx` に、`URL.createObjectURL` / `revokeObjectURL` をスタブし `HTMLAnchorElement.prototype.click` をスパイして、押すと `download` が `メモ.md` で Blob の中身が入力と同じ（`await blob.text()`）・型が `text/markdown;charset=utf-8` であること、`revokeObjectURL` が呼ばれること、空と空白だけのときは押せないこと、3つの表示それぞれでボタンがちょうど1つあること、Tab で移動して Enter でダウンロードできること、`fetch` が呼ばれないことのテストを追加し、`npm test` が成功することを確認する
- [x] 2.3 `components/tools/registry.ts` の Markdownプレビューの説明文の末尾に「.md ファイルとしてダウンロードできます。」を追記し（registry のテストが説明文に依存していれば更新する）、README.md のツール一覧の説明を同じ文言にそろえ、データの扱いの節に「Markdownプレビューのダウンロードはブラウザ内でファイルを作り、送信しません」の旨を追記して、`npm test` と `npm run format:check` が成功することを確認する（2.2 と同じコミットに含める）
- [x] 2.4 `npm run lint` を実行し、エラーがないことを確認する
- [x] 2.5 `components/icon-button.tsx` に `CopyButton` の既定と同じ枠ありの `variant="outline"` を追加し、`CopyButton` の既定はそのクラスを使うようにする。ダウンロードのボタンを `outline` にし（design D3）、`icon-button.test.tsx` に outline が枠ありになるテスト、`markdown-preview.test.tsx` にダウンロードのボタンが枠ありであることの確認を追加し、AGENTS.md の `IconButton` の説明に outline の使いどころを追記して、`npm test` と `npm run lint` が成功することを確認する

## 3. 最終確認

- [x] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [ ] 3.2 ビルド版（`out/`）を Chrome と Safari で開き、ライト・ダークそれぞれで、3つの表示の見出しの行にダウンロードのボタンが1つあり行が崩れないこと（幅 390px と 1280px）、ツールチップが「Markdown をダウンロード」であること、見出し付きの Markdown（日本語・Mermaid を含む）を押すと `<見出し>.md` が保存され、テキストエディタで開くと文字化けせず入力と同じ内容であること、見出しなしでは `markdown.md` になること、空のときは押せないこと、開発者ツールのネットワークに通信が出ないことを確認し、スクリーンショットで記録する（確認用のツールはリポジトリの外に置く）
- [x] 3.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認する

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版の Markdownプレビューで .md ファイルをダウンロードできることを確認する
