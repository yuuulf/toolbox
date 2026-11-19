import { Suspense } from 'react'
import { BrandLink } from './brand-link'
import type { ToolNavItem } from './tool-nav'
import { ToolNav, ToolNavList } from './tool-nav'

type Props = {
  items: ToolNavItem[]
}

// 幅 1024px 以上で左に常に表示する。画面の高さに固定し、ツールが増えて長くなったら中でスクロールする
export function Sidebar({ items }: Props) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-200 px-3 py-4 lg:flex dark:border-zinc-800">
      <div className="px-3">
        <BrandLink />
      </div>
      {/* static export ではビルド時に URL が決まるため usePathname は中断しないが、
          サーバーで描画する構成に戻したときに備えて、現在地の強調なしのナビをフォールバックに残す */}
      <Suspense fallback={<ToolNavList items={items} />}>
        <ToolNav items={items} />
      </Suspense>
    </aside>
  )
}
