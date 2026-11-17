'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type ToolNavItem = {
  slug: string
  name: string
}

type Props = {
  items: ToolNavItem[]
}

export function ToolNav({ items }: Props) {
  const pathname = usePathname()
  return <ToolNavList items={items} currentPath={pathname} />
}

type ListProps = Props & {
  currentPath?: string
}

// usePathname を使わない表示部分。Suspense のフォールバック（現在地の強調なし）にも使う
export function ToolNavList({ items, currentPath }: ListProps) {
  return (
    <nav
      aria-label="ツール"
      className="border-b border-zinc-200 dark:border-zinc-800"
    >
      <ul className="mx-auto flex w-full max-w-5xl flex-wrap gap-2 px-4 py-2">
        {items.map((item) => {
          const href = `/tools/${item.slug}`
          const isCurrent = currentPath === href
          return (
            <li key={item.slug}>
              <Link
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                className={
                  isCurrent
                    ? 'block rounded-md bg-zinc-900 px-3 py-1 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'block rounded-md px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }
              >
                {item.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
