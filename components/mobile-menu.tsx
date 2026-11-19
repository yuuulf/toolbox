'use client'

import { Suspense, useEffect, useId, useRef, useState } from 'react'
import type { ToolNavItem } from './tool-nav'
import { ToolNav, ToolNavList } from './tool-nav'

type Props = {
  items: ToolNavItem[]
}

// この幅以上ではサイドバーにツール一覧が出るので、メニューを開いたままにしない（Tailwind の lg と同じ）
const WIDE_QUERY = '(min-width: 1024px)'

// 狭い画面のツール一覧のメニュー。<dialog> の showModal() で開くと、フォーカスの閉じ込め・外側の操作の無効化・
// Esc キーで閉じる・閉じた後にメニューボタンへフォーカスを戻す、をブラウザが行う
export function MobileMenu({ items }: Props) {
  const dialogId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  function openMenu() {
    dialogRef.current?.showModal()
    setOpen(true)
  }

  function closeMenu() {
    dialogRef.current?.close()
  }

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia(WIDE_QUERY)
    const handleChange = () => {
      if (query.matches) dialogRef.current?.close()
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label="メニューを開く"
        title="メニューを開く"
        className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
          className="size-5"
        >
          <path d="M4 6h16 M4 12h16 M4 18h16" />
        </svg>
      </button>
      {/* Esc キーや close() のどちらで閉じても、close イベントで状態を戻す */}
      <dialog
        id={dialogId}
        ref={dialogRef}
        aria-labelledby={`${dialogId}-title`}
        onClose={() => setOpen(false)}
        className="m-0 h-dvh max-h-none w-72 max-w-full bg-white p-4 text-zinc-900 backdrop:bg-black/50 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id={`${dialogId}-title`} className="text-sm font-semibold">
            ツール
          </h2>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="メニューを閉じる"
            title="メニューを閉じる"
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
              className="size-4"
            >
              <path d="M6 6l12 12 M18 6L6 18" />
            </svg>
          </button>
        </div>
        <Suspense
          fallback={<ToolNavList items={items} onNavigate={closeMenu} />}
        >
          <ToolNav items={items} onNavigate={closeMenu} />
        </Suspense>
      </dialog>
    </>
  )
}
