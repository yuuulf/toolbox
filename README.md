# toolbox

ブラウザ内で完結する便利ツール集です。Next.js（App Router）+ Tailwind CSS で作っています。

## ツール一覧

| ツール              | パス                    | 内容                                                   | ブラウザへの保存                         |
| ------------------- | ----------------------- | ------------------------------------------------------ | ---------------------------------------- |
| JSON整形/検証       | `/tools/json-formatter` | JSON を整形・圧縮し、構文エラーの位置を表示します。    | なし                                     |
| 文字数カウント      | `/tools/char-counter`   | 文字数・空白を除いた文字数・行数・バイト数を数えます。 | なし                                     |
| UUID/パスワード生成 | `/tools/id-generator`   | UUID v4 とランダムなパスワードを生成します。           | localStorage（パスワード生成の設定のみ） |

## データの扱い

- 入力した内容や生成した結果は、サーバーや外部サービスに送信しません。処理はすべてブラウザ内で行います。
- 保存するのは一部ツールの設定だけで、保存先はブラウザの localStorage です。入力内容や生成した値は保存しません。
- localStorage が使えない環境（プライベートモードなど）でも、設定が保存されないだけでツールは動きます。

## セットアップ

Node.js は [mise](https://mise.jdx.dev/) で管理しています（バージョンは `mise.toml`）。

```sh
mise install
npm install
npm run dev
```

http://localhost:3000 を開きます。mise をシェルで有効化していない場合は、`mise exec -- npm run dev` のようにコマンドの前に `mise exec --` を付けます。

## コマンド

| コマンド               | 内容                                         |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | 開発サーバーを起動                           |
| `npm run build`        | 本番用にビルド                               |
| `npm run start`        | ビルドしたアプリを起動                       |
| `npm run lint`         | ESLint を実行                                |
| `npm run format`       | Prettier で整形                              |
| `npm run format:check` | 整形されているか確認（ファイルは変更しない） |
| `npm test`             | テストを実行（Vitest）                       |
| `npm run test:watch`   | テストをウォッチモードで実行                 |

## ツールの追加手順

1. `lib/tools/<name>.ts` にロジックを書き、同じ場所に `<name>.test.ts` でテストを書く
2. `components/tools/<tool-slug>.tsx` に画面を書き、同じ場所に `<tool-slug>.test.tsx` でテストを書く
3. `components/tools/registry.ts` の `tools` に1エントリ追加する

トップの一覧・ナビゲーション・`/tools/<tool-slug>` のページは登録情報から自動で作られます。追加したら、このファイルの「ツール一覧」も更新してください。

ディレクトリ構成やコードスタイルなどの規約は [AGENTS.md](./AGENTS.md) を参照してください。
