import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/header'
import { ToolNav, ToolNavList } from '@/components/tool-nav'
import { tools } from '@/components/tools/registry'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'toolbox',
    template: '%s | toolbox',
  },
  description: 'ブラウザ内で完結する便利ツール集',
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
