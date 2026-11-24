# Proposal

## Why

ユーザーが toolbox のアイコンを新しいデザイン（3枚のカードが重なったマークから、4枚のカードを2×2に並べたマーク）に変えた。ファビコンと、サイドバー・上部のバーのアプリ名の隣のアイコンを新しいアイコンに差し替える。

## What Changes

- `public/favicon-light.png`・`public/favicon-dark.png` を、新しい元画像（`~/Downloads/icon_l.png`・`~/Downloads/icon_d.png`）から作った画像に差し替える
  - 元画像は 2000×2000 の PNG。アルファはあるが全ピクセルが不透明で、背景が塗りつぶされている
  - ライト用は白（#FFFFFF）の背景に #424242 のカード3枚と #4DB6AC のカード1枚、ダーク用は #424242 の背景に白のカード3枚と #4DB6AC のカード1枚。緑のカードはどちらも右下
  - マークの範囲は両方とも (200, 200)〜(1797, 1799)
- 背景を透明にし（ユーザーの依頼）、上下左右の余白が 4% の正方形に切り詰めて 256×256 に縮小する。加工方法は前回までと同じ（`openspec/changes/archive/2026-11-18-replace-favicon/design.md` の D1）
- `toolbox-shell` の「toolbox のファビコンを表示する」の、マークの形とカードの枚数の記述を新しいデザインに合わせる
- 画像を参照するコード（`app/layout.tsx` の `metadata.icons`、`components/brand-link.tsx`）とファイル名は変えない

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `toolbox-shell`: 「toolbox のファビコンを表示する」で、マークを「3枚のカードが重なったマーク」から「4枚のカードを2×2に並べたマーク」に、各モードのカードを「濃いグレー（白）2枚と緑1枚」から「濃いグレー（白）3枚と緑1枚」に変える。透明な背景とライト/ダークの切り替えは変えない

## データ保存

すべてのツールで変更なし（画像の差し替えだけで、保存する内容は変わらない）。

## Out of scope

- 元画像のデザインそのものの変更（背景の透明化と余白の切り詰め以外の加工）
- ファビコンの切り替え方法、サイドバー・上部のバーでのアイコンの表示方法や大きさの変更
- `apple-icon`、PWA の manifest、OGP 画像

## Impact

- `public/favicon-light.png`・`public/favicon-dark.png` の差し替え
- `openspec/specs/toolbox-shell/spec.md`（アーカイブ時に差分を反映）
- コード・テスト・README・AGENTS.md の変更はなし（テストはファイルの場所と参照だけを確かめていて、画像の内容に依存しない。README と AGENTS.md はアイコンの形に触れていない）
- 依存パッケージの追加はなし（画像の加工はリポジトリの外で行い、結果の PNG だけをコミットする）
