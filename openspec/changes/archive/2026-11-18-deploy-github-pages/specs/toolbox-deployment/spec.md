# Spec Delta

## Purpose

main ブランチにマージされた toolbox を、検証を通った版だけ自動で GitHub Pages に公開し、ブラウザからいつでも使えるようにする。

## ADDED Requirements

### Requirement: main へのマージで公開する
main ブランチに変更が入ったとき（PR のマージ）、システムは自動でアプリをビルドし、`https://yuuulf.github.io/toolbox/` に公開しなければならない（SHALL）。公開されるのは main の最新のコミットの内容でなければならない。

#### Scenario: PR をマージする
- **WHEN** PR を main にマージする
- **THEN** 手作業なしでデプロイが始まり、完了後に `https://yuuulf.github.io/toolbox/` でマージ後の内容（追加したツールなど）が表示される

#### Scenario: PR の作成・更新では公開しない
- **WHEN** main 以外のブランチに push する、または PR を作成・更新する
- **THEN** 公開中のサイトは変わらない

### Requirement: 検証に通った版だけを公開する
システムは公開の前に、CI と同じ検証（lint・フォーマットの確認・テスト・ビルド）を実行し、すべて成功したときだけ公開しなければならない（SHALL）。1つでも失敗した場合は公開せず、それまで公開していた版をそのまま残さなければならない。

#### Scenario: 検証に失敗する
- **WHEN** main の最新コミットでテストが失敗する
- **THEN** デプロイは失敗として記録され、公開中のサイトは前の版のまま表示される

### Requirement: 手動で再デプロイできる
システムは、main の最新の内容を GitHub の Actions 画面から手動で公開し直せなければならない（SHALL）。

#### Scenario: 手動で実行する
- **WHEN** 管理者が Actions 画面でデプロイのワークフローを main に対して手動実行する
- **THEN** マージのときと同じ検証と公開が行われる

### Requirement: 公開版は静的ファイルの配信だけで動く
公開版は、サーバー側の処理なしに静的ファイルの配信だけで、すべてのツールのページと 404 ページを提供しなければならない（SHALL）。

#### Scenario: 公開版で各ツールを開く
- **WHEN** `https://yuuulf.github.io/toolbox/` から各ツールのページを開いて操作する
- **THEN** すべてのツールがローカルの開発サーバーと同じように表示・動作し、ページの再読み込みや URL の直接入力でも同じページが表示される

#### Scenario: 公開版で未登録の slug を開く
- **WHEN** `https://yuuulf.github.io/toolbox/tools/does-not-exist` を開く
- **THEN** toolbox の 404 ページが 404 ステータスで表示される
