# Proposal

## Why

README や設計メモなどの Markdown を書くとき、図（Mermaid）も含めた見た目をその場で確かめたい。外部のプレビューサイトに貼り付けずに、ブラウザ内で完結する Markdown プレビューを toolbox に加える。

## What Changes

新しいツール「Markdownプレビュー」（`/tools/markdown-preview`）を追加する。

- **入力と同時のプレビュー**
  - 入力欄に Markdown を書くと、プレビューを同時に更新する
  - GFM（表・タスクリスト・取り消し線・URL の自動リンク）に対応する
  - コードブロックの言語が `mermaid` のときは、Mermaid の図として描く。図の構文に誤りがあるときは、その図の位置にエラーを表示し、ほかの部分のプレビューは続ける
  - 図の配色は OS のライト/ダーク設定に合わせる
- **表示の切り替え**
  - 既定は入力欄とプレビューを左右に並べる表示。切り替えで「入力のみ」「プレビューのみ」にして、それぞれを画面幅いっぱいで使える
- **保存**
  - 「保存」ボタンを押したときだけ、入力中の Markdown を localStorage に保存する（1件だけ。保存すると前の内容を置き換える）
  - 次にツールを開いたとき、保存した内容を入力欄に復元する
- **安全のための制限**
  - Markdown の中の HTML は解釈せず、文字のまま表示する
  - 画像（`![alt](url)`）は読み込まない。外部のサーバーへ通信が発生するため、代わりに代替テキストと URL を表示する
  - `javascript:` などの危険なリンクは無効にする。リンクは新しいタブで開く
- ツール登録情報に1エントリを追加し、README のツール一覧と「データの扱い」を更新する
- **依存パッケージを追加する**: `react-markdown`・`remark-gfm`（Markdown の解析と表示）、`mermaid`（図の描画）。Markdown と Mermaid の解析はブラウザ標準 API では実現できないため。`mermaid` は大きいので、図があるときだけ読み込む

## Capabilities

### New Capabilities

- `tool-markdown-preview`: GFM と Mermaid の図に対応した Markdown のプレビュー、表示の切り替え、ボタンでの保存と復元

### Modified Capabilities

- `toolbox-shell`: 「トップページにツール一覧を表示する」と「デスクトップ幅では各ツールを縦スクロールなしで使える」のシナリオで列挙しているツールに、Markdownプレビューを加える

## データ保存

| ツール                  | データ保存                                                                     |
| ----------------------- | ------------------------------------------------------------------------------ |
| Markdownプレビュー      | localStorage（「保存」を押したときの Markdown 1件だけ。表示の切り替えは保存しない） |
| JSON整形/検証           | なし（変更なし）                                                               |
| 文字数カウント          | なし（変更なし）                                                               |
| UUID/パスワード生成     | localStorage（変更なし）                                                       |
| カラー変換/コントラスト | localStorage（変更なし）                                                       |
| チェックリスト          | localStorage（変更なし）                                                       |
| テキスト差分比較        | なし（変更なし）                                                               |

## Out of scope

- コードブロックの色付け（シンタックスハイライト）
- HTML のコピーやファイルへの書き出し、ファイルの読み込み
- 複数の下書きの保存、自動保存
- Markdown 中の HTML の表示、画像の表示
- 数式（KaTeX など）をはじめとする、GFM と Mermaid 以外の拡張
- スクロール位置の同期（入力欄とプレビュー）

## Impact

- `package.json` / `package-lock.json`（`react-markdown`・`remark-gfm`・`mermaid` を `dependencies` に追加）
- `lib/tools/markdown-preview.ts`（+テスト）の追加
- `components/tools/markdown-preview/`（+テスト）の追加
- `components/tools/registry.ts` に1エントリ、`registry.test.ts` の件数
- README.md のツール一覧・データの扱い
