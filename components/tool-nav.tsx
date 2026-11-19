'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type ToolNavItem = {
  slug: string
  name: string
}

type Props = {
  items: ToolNavItem[]
  /** リンクを押したときに呼ぶ（メニューを閉じるため） */
  onNavigate?: () => void
}

export function ToolNav({ items, onNavigate }: Props) {
  const pathname = usePathname()
  return (
    <ToolNavList items={items} currentPath={pathname} onNavigate={onNavigate} />
  )
}

type ListProps = Props & {
  currentPath?: string
}

// usePathname を使わない表示部分。Suspense のフォールバック（現在地の強調なし）にも使う。
// サイドバーとメニューの両方で使うので、ツールが増えても折り返さないよう縦に並べる
export function ToolNavList({ items, currentPath, onNavigate }: ListProps) {
  return (
    <nav aria-label="ツール">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const href = `/tools/${item.slug}`
          const isCurrent = isSamePath(currentPath, href)
          return (
            <li key={item.slug}>
              <Link
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={onNavigate}
                className={
                  isCurrent
                    ? 'block rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'block rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
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

// trailingSlash: true のため、usePathname は「/tools/<slug>/」のように末尾に / が付いた値を返す。
// 末尾の / の有無は同じページとして比べる
function isSamePath(path: string | undefined, href: string): boolean {
  if (path === undefined) return false
  const normalize = (value: string) => value.replace(/\/+$/, '')
  return normalize(path) === normalize(href)
}
