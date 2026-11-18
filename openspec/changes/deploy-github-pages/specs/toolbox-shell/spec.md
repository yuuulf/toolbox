# Spec Delta

## MODIFIED Requirements

### Requirement: ツールごとのページ
システムは各ツールを `/tools/<slug>` で表示しなければならない（SHALL）。登録されていない slug へのアクセスには 404 ページを返さなければならない。この仕様に書くパス（`/` や `/tools/<slug>`）は、公開先のベースパス `/toolbox` からの相対パスとする（公開版では `https://yuuulf.github.io/toolbox/tools/<slug>`、開発サーバーでは `http://localhost:3000/toolbox/tools/<slug>`）。

#### Scenario: 登録済みツールのページ
- **WHEN** ユーザーが `/tools/json-formatter` を開く
- **THEN** ページ見出しにツール名が表示され、JSON整形ツールが利用できる

#### Scenario: 未登録の slug
- **WHEN** ユーザーが `/tools/does-not-exist` を開く
- **THEN** 404 ページが表示される

#### Scenario: ベースパスの下で動く
- **WHEN** ユーザーが公開版のトップページ `https://yuuulf.github.io/toolbox/` から一覧・ナビゲーション・ヘッダーのリンクをたどる
- **THEN** すべてのリンク先と、ページが読み込むスクリプト・スタイル・アイコンが `/toolbox` の下にあり、どれも 404 にならない
