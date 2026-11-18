import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // GitHub Pages で静的ファイルとして配信するため、ビルドで out/ に書き出す。
  // Cache Components は static export と同時に使えない（PPR cannot be enabled in export mode）ので有効にしない
  output: 'export',
  // プロジェクトサイト（https://yuuulf.github.io/toolbox/）の下で配信されるため。
  // 付け忘れに開発中に気づけるよう、開発サーバーでも同じパスにする
  basePath: '/toolbox',
  // ページを tools/<slug>/index.html として書き出す。tools/<slug>.html だと、同じ名前のディレクトリ
  // （クライアント遷移用のデータ）があるため GitHub Pages がディレクトリを優先し、直接開くと 404 になる
  trailingSlash: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
