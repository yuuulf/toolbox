# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `move-nav-to-sidebar`。依存パッケージは追加しない。

## 1. ナビゲーションの部品

- [ ] 1.1 `components/header.tsx` の中身を `components/brand-link.tsx`（`BrandLink`）に移し、`header.tsx` を削除する。`header.test.tsx` を `brand-link.test.tsx` に移し、リンク名が「toolbox」のまま・アイコン2枚が読み上げられない・下線が出ないことを検証する（design.md D2）。`npm test` が成功することを確認
- [ ] 1.2 `components/tool-nav.tsx` の `ToolNavList` を縦並び・幅いっぱいのリンクに変え、リンクを押したときに呼ぶ `onNavigate`（省略可）を受け取れるようにする（design.md D2）。`tool-nav.test.tsx` に、リンクを押すと `onNavigate` が呼ばれることを加え、既存の現在地の強調のテストが通ることを確認する。`npm test` が成功することを確認
- [ ] 1.3 `components/mobile-menu.tsx`（`MobileMenu`）を実装する（design.md D3）。メニューボタン（`aria-expanded`・`aria-controls`）、`<dialog>`（見出し・閉じるボタン・ツール一覧）、リンクを押したら閉じる、1024px 以上になったら閉じる。`mobile-menu.test.tsx` で、`HTMLDialogElement.prototype` の `showModal` / `close` の代わりを入れて、ボタンで開くと `aria-expanded` が true になりリンクが見えること、閉じるボタン・リンクの選択・`close` イベントで閉じて `aria-expanded` が false に戻ること、開く前はリンクが表示されていないことを検証する。`npm test` が成功することを確認
- [ ] 1.4 `components/sidebar.tsx`（`Sidebar`）と `components/mobile-header.tsx`（`MobileHeader`）を実装する（design.md D1）。`sidebar.test.tsx` と `mobile-header.test.tsx` で、それぞれにアプリ名のリンクがあり、サイドバーにはツール一覧、上部のバーにはメニューボタンがあることと、表示を切り替えるクラス（`hidden lg:flex` / `lg:hidden`）を検証する。`npm test` が成功することを確認

## 2. 全体の配置

- [ ] 2.1 `app/layout.tsx` を、`lg` 以上でサイドバーとメインの横並び、それ未満で上部のバーとメインの縦並びに変える（design.md D1）。`app/page.tsx`・`app/not-found.tsx`・`app/tools/[slug]/page.tsx` の `main` が新しい配置で中央に寄ることを確認する。`npm test` と `npm run build` が成功することを確認
- [ ] 2.2 AGENTS.md の構成図（`header.tsx`・`tool-nav.tsx`）を新しいファイルに合わせて更新する。`npm run lint` と `npm run format:check` が通ることを確認

## 3. 空いた高さで各ツールの欄を広げる

- [ ] 3.1 サイドバーの配置で、1470×800 の各ツールの初期表示と「通常の操作の後」（toolbox-shell の spec）の内容の下端を実測し、design.md D4 の対象の欄（JSON整形/検証・文字数カウント・UUID/パスワード生成・テキスト差分比較・チェックリスト・Markdownプレビュー）の新しい値を決めて design.md D4 に記録する（測定用のツールはリポジトリの外に置く）
- [ ] 3.2 3.1 で決めた値で各ツールの欄を広げる。UUID の行数の上限は名前付き定数にする。値を確かめている既存のテストがあれば更新する。`npm test` が成功し、1470×800 で各ツールの初期表示と「通常の操作の後」に縦スクロールが出ないことを確認

## 4. 最終確認

- [ ] 4.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [ ] 4.2 開発サーバーで、ライト・ダーク両方の次を確認する（確認用のツールはリポジトリの外に置く）
  - 幅 1470px: サイドバーにアプリ名とアイコン・7つのツールが1列に並び、現在のツールが強調されること、上部の帯がないこと、アプリ名とツールのリンクで遷移できること
  - 幅 1024px: サイドバーの右で各ツールの2列表示が崩れず、横スクロールが出ないこと
  - 幅 360px: 上部のバーとメニューボタンが表示され、メニューを開くとツールが並ぶこと。Esc キー・閉じるボタン・リンクの選択で閉じること。キーボードだけで開閉でき、閉じるとフォーカスがメニューボタンに戻ること。横スクロールが出ないこと
  - 1470×800 で、7つのツールすべての初期表示と「通常の操作の後」に縦スクロールが出ないこと
- [ ] 4.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版でサイドバーとメニューが動くことを確認する
