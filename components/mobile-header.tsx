import { BrandLink } from './brand-link'
import { MobileMenu } from './mobile-menu'
import type { ToolNavItem } from './tool-nav'

type Props = {
  items: ToolNavItem[]
}

// 幅 1024px 未満で上部に出す細いバー。ツール一覧はメニューボタンで開く
export function MobileHeader({ items }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 lg:hidden dark:border-zinc-800">
      <BrandLink />
      <MobileMenu items={items} />
    </header>
  )
}
