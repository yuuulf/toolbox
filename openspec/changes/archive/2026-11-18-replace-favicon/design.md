# Design

## Context

- 今のファビコンは `app/favicon.ico`（create-next-app の既定の Next.js ロゴ）。メタデータのファイル規約で自動的に `<link rel="icon">` になる。
- 元画像は `~/Downloads/icon-ligth.png`（ライト用）と `~/Downloads/ icon-dark.png`（ダーク用。ファイル名の先頭に空白がある）。どちらも 2000×2000 の RGBA PNG だが、背景は不透明で塗りつぶされている。
  - ライト用は背景が白、カードが #424242 と #4DB6AC
  - ダーク用は背景が #424242、カードが白と #4DB6AC
  - マークは両方とも (411, 648)〜(1620, 1474) の範囲にある
- アプリは static export で、`basePath: '/toolbox'` の下に配信される（toolbox-deployment）。

## Goals / Non-Goals

**Goals:**

- ライト/ダークの2枚を OS の設定で切り替え、公開版でも開発サーバーでも `/toolbox` の下から読み込む

**Non-Goals:**

- 画像の加工手順をリポジトリに入れること（加工は一度きりで、依存も増やしたくないため）

## Decisions

### D1. 画像の加工: 背景を透明にし、余白 4% の正方形に切り詰めて 256px にする

- **背景の透明化**: 各ピクセルを「背景色 B と前景色 F（カードの2色のうち近いほう）の混ざり」とみなして不透明度を求め、色は F にする。アンチエイリアスの縁もなめらかに透ける。カードの間の隙間は背景色で描かれているので透明になり、タブの色が透けて元の絵と同じ見た目になる。
  - 単純な「白を透明にする」方式（color to alpha）は使わない。#424242 のカードまで半透明になるため。
- **切り詰め**: マークの範囲（1210×827）を中心に、長辺 + 上下左右 4% の正方形（1307px）にする。
- **サイズ**: 256×256 に縮小する。高解像度の画面の 16〜32px 表示にも足り、1枚 10KB 前後になる。
- **手段**: Python の標準ライブラリだけで書いたスクリプトと macOS の `sips`（縮小）をリポジトリの外で使い、結果の PNG だけをコミットする。計画のときに試作した結果を、ライト・ダークのタブの色に重ねて確かめてある。

### D2. 切り替えは `metadata.icons` に `media` 付きで2つ書く

`app/layout.tsx` の `metadata` に次のように書く。

```ts
icons: {
  icon: [
    { url: `${BASE_PATH}/favicon-light.png`, media: '(prefers-color-scheme: light)' },
    { url: `${BASE_PATH}/favicon-dark.png`, media: '(prefers-color-scheme: dark)' },
  ],
},
```

- メタデータのファイル規約（`app/icon.png` など）では `media` を指定できないため、`metadata.icons` を使う。画像は `public/` に置く。
- ファイル名は `favicon-light.png` / `favicon-dark.png` にする。`icon` はメタデータの特殊ファイル名なので、`app/` に置かない画像でも紛らわしい名前を避ける（AGENTS.md の規約）。
- `app/favicon.ico` は削除する。残すと Next.js のロゴの `<link rel="icon">` も出力され、ブラウザによってはそちらが使われるため。

### D3. ベースパスを `lib/base-path.ts` の定数にまとめる

計画のときに試したところ、`metadata.icons` の URL には `basePath` が自動では付かなかった（`href="/icon-light.png"` になった）。そこで `lib/base-path.ts` に `BASE_PATH = '/toolbox'` を置き、`next.config.ts`（`basePath: BASE_PATH`）と `app/layout.tsx` の両方から使う。こうすると `/toolbox/favicon-light.png` になることを確かめた。

- 検討した他の方法: URL に `/toolbox` を直書きする。`next.config.ts` と2か所で同じ値を管理することになり、片方だけ変えたときにファビコンが 404 になるので採らない。

### D4. ヘッダーのアイコンは `next/image` で PNG を import し、`dark:` で切り替える

- `components/header.tsx` で `public/favicon-light.png` と `public/favicon-dark.png` を import し、`next/image` で 24×24（`size-6`。アプリ名 `text-lg` の行の高さに収まる大きさ）で表示する。
  - import した画像はビルド時に `/toolbox` 付きの URL になるため、`BASE_PATH` を付けなくてよい。幅と高さも自動で決まる。
  - static export では既定のローダーの画像最適化を使えないため、`unoptimized` を指定する。
- 2枚を並べ、ライト用に `dark:hidden`、ダーク用に `hidden dark:block` を付けて切り替える。画面のほかの部分と同じく `dark:` バリアントで OS 設定に追従させるため（`<picture>` の `media` でも切り替えられるが、`next/image` では書けない）。
- 画像は `alt=""` の飾りにし、リンク名は今までどおりテキストの「toolbox」から決まるようにする。
- アイコンと文字は `inline-flex items-center gap-2` で並べる。リンクの `hover:underline` は外す。ほかにホバー時の表示は加えない。キーボード操作時のフォーカス枠はブラウザの既定のまま残る。

## Risks / Trade-offs

- [`media` 付きの `<link rel="icon">` に対応しないブラウザがある（Safari など）] → そうしたブラウザは片方を使う。ライト用を先に書くので、多くの場合はライト用になる。カードが濃いグレーなので、ダークのタブでも緑のカードと形で見分けられる。
- [16px ではカードの重なりが細かく見えにくい] → 余白を 4% まで詰めて、できるだけ大きく表示する。デザインの変更は対象外。
- [ブラウザがファビコンをキャッシュし、公開後もしばらく古いアイコンが出る] → ファイル名が `favicon.ico` から変わるので、多くの場合は新しいアイコンが読み込まれる。出ないときは再読み込みで直る。
