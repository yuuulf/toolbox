import type { Metadata } from 'next'
import { MobileHeader } from '@/components/mobile-header'
import { Sidebar } from '@/components/sidebar'
import { tools } from '@/components/tools/registry'
import { BASE_PATH } from '@/lib/base-path'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'toolbox',
    template: '%s | toolbox',
  },
  description: 'ブラウザ内で完結する便利ツール集',
  // OS のライト/ダーク設定で切り替えるため、media を指定できる metadata.icons を使う（app/icon.png では指定できない）。
  // ここの URL には basePath が自動で付かないので、BASE_PATH を付ける
  icons: {
    icon: [
      {
        url: `${BASE_PATH}/favicon-light.png`,
        media: '(prefers-color-scheme: light)',
      },
      {
        url: `${BASE_PATH}/favicon-dark.png`,
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
}

// Client Component にはシリアライズできる値だけ渡す（component は含めない）
const navItems = tools.map(({ slug, name }) => ({ slug, name }))

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className="h-full antialiased">
      {/* 幅 1024px 以上は左のサイドバーとメインを横に、それ未満は上部のバーとメインを縦に並べる */}
      <body className="flex min-h-full flex-col bg-white text-zinc-900 lg:flex-row dark:bg-zinc-950 dark:text-zinc-100">
        <Sidebar items={navItems} />
        <MobileHeader items={navItems} />
        {/* 各ページの main は、この中で今までどおり最大幅 1024px で中央に寄せる */}
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  )
}
