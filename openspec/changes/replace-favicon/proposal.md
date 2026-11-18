# Proposal

## Why

ファビコンが create-next-app の既定のまま（Next.js のロゴ）で、toolbox のアイコンになっていない。公開版（https://yuuulf.github.io/toolbox/）をタブで開いたときに見分けられるよう、用意したアイコンに置き換える。

## What Changes

- ファビコンを、ユーザーが用意したアイコン（3枚のカードが重なったマーク）に置き換える
  - 元画像は2000×2000のPNGが2枚。ライト用は白の背景に濃いグレーのカード、ダーク用は濃いグレー（#424242）の背景に白のカードで、どちらにも緑のカードが1枚ある
  - 背景を透明にし、マークの周りの余白を詰める（元画像ではマークが幅の約6割しかなく、16pxのタブでは小さすぎるため）
- OS のライト/ダーク設定に合わせて、ライト用とダーク用のアイコンを切り替える
- 既定の `app/favicon.ico`（Next.js のロゴ）を削除する

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `toolbox-shell`: すべてのページで toolbox のファビコンを表示し、OS のライト/ダーク設定に合わせて切り替える要件を追加する

## データ保存

すべてのツールで変更なし（ファビコンの差し替えだけで、保存する内容は変わらない）。

## Out of scope

- iOS のホーム画面用アイコン（`apple-icon`）、PWA の manifest、OGP 画像
- ヘッダーなど画面内へのロゴの表示
- アイコンのデザインそのものの変更（背景の透明化と余白の切り詰め以外）

## Impact

- `public/favicon-light.png`・`public/favicon-dark.png` の追加（`public/` を新しく作る）
- `app/favicon.ico` の削除
- `app/layout.tsx` の `metadata.icons`
- `lib/base-path.ts` の追加と `next.config.ts`（ベースパスを1か所で定義する）
- AGENTS.md の構成図
- 依存パッケージの追加はなし（画像の加工はリポジトリの外で行い、結果の PNG だけをコミットする）
