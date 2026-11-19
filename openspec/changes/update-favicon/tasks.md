# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `update-favicon`。依存パッケージは追加せず、画像の加工に使うスクリプトはリポジトリの外（作業用ディレクトリ）に置く。

## 1. アイコン画像

- [ ] 1.1 `~/Downloads/icon_l.png`・`~/Downloads/icon_d.png` から、前回の design.md（`openspec/changes/archive/2026-11-18-replace-favicon/design.md`）の D1 と同じ方法で、背景を透明にして余白 4% の正方形に切り詰め（マークの範囲 1768×1219 の長辺に合わせて約 1909px）、256×256 に縮小した画像を作り、`public/favicon-light.png`・`public/favicon-dark.png` を置き換える。両方が 256×256 の RGBA で、四隅が透明（アルファ 0）、カードの中央が不透明であることを確かめる。ライト・ダークのタブの色に重ねたプレビューで、縁が汚れていないことと、調整後の形になっていることを目で確認する
- [ ] 1.2 `npm test` を実行し、`app/layout.test.ts` と `components/brand-link.test.tsx` が変更なしで成功することを確認する

## 2. 最終確認

- [ ] 2.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功し、`out/favicon-light.png`・`out/favicon-dark.png` が新しい画像と同じ内容であることを確認する
- [ ] 2.2 開発サーバーで、ライト・ダークそれぞれの表示でトップページを開き、タブのファビコンとサイドバー（幅 1024px 以上）・上部のバー（幅 1024px 未満）のアイコンが新しい形で表示されることを、スクリーンショットで確認する（確認用のツールはリポジトリの外に置く）
- [ ] 2.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認する

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版で新しいファビコンとアイコンが表示されることを確認する（ブラウザのキャッシュで古いアイコンが残る場合は再読み込みする）
