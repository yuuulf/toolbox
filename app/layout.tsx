import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/header'
import { ToolNav, ToolNavList } from '@/components/tool-nav'
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
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Header />
        {/* static export ではビルド時に URL が決まるため usePathname は中断しないが、
            サーバーで描画する構成に戻したときに備えて、現在地の強調なしのナビをフォールバックに残す */}
        <Suspense fallback={<ToolNavList items={navItems} />}>
          <ToolNav items={navItems} />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
