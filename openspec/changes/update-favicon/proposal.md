# Proposal

## Why

ユーザーがアイコンのデザインを微調整した。いまのファビコンとサイドバー・上部のバーのアプリ名の隣のアイコンを、調整後のアイコンに差し替える。

## What Changes

- `public/favicon-light.png`・`public/favicon-dark.png` を、調整後の元画像（`~/Downloads/icon_l.png`・`~/Downloads/icon_d.png`）から作り直した画像に差し替える
  - 元画像は前回と同じく 2000×2000 の不透明な PNG。ライト用は白の背景に #424242 と #4DB6AC のカード、ダーク用は #424242 の背景に白と #4DB6AC のカード
  - 前回の元画像との違いはマークの形と大きさ。マークの範囲は (411, 648)〜(1620, 1474) から (116, 405)〜(1883, 1623) に広がった
- 加工方法は前回（`openspec/changes/archive/2026-11-18-replace-favicon/design.md` の D1）と同じ。背景を透明にし、上下左右の余白が 4% の正方形に切り詰めて、256×256 に縮小する
- 画像を参照するコード（`app/layout.tsx` の `metadata.icons`、`components/brand-link.tsx`）とファイル名は変えない

## Capabilities

### New Capabilities

なし

### Modified Capabilities

なし（`toolbox-shell` の「toolbox のファビコンを表示する」が求める内容、つまり3枚のカードのマーク・透明な背景・ライト/ダークでのカードの色は、差し替えた後も満たされる。そのため `.openspec.yaml` で `skip_specs: true` にする）

## データ保存

すべてのツールで変更なし（画像の差し替えだけで、保存する内容は変わらない）。

## Out of scope

- アイコンのデザインそのものの変更（背景の透明化と余白の切り詰め以外の加工）
- ファビコンの切り替え方法やヘッダーの表示の変更
- `apple-icon`、PWA の manifest、OGP 画像

## Impact

- `public/favicon-light.png`・`public/favicon-dark.png` の差し替えだけ
- コード・テスト・README・AGENTS.md の変更はなし（テストはファイルの場所と参照を確かめているだけで、画像の内容には依存しない）
- 依存パッケージの追加はなし（画像の加工はリポジトリの外で行い、結果の PNG だけをコミットする）
