export type ItemView = { id: string; text: string; checked: boolean }

type Props = {
  items: ItemView[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function ItemList({ items, onToggle, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        項目はまだありません。
      </p>
    )
  }

  // 1画面に収めるため、項目が多いときは一覧の中でスクロールさせる
  return (
    <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2">
          <label className="flex min-w-0 flex-1 items-start gap-2 py-0.5 text-sm">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.id)}
              className="mt-0.5 shrink-0"
            />
            <span
              className={
                item.checked
                  ? 'break-words text-zinc-500 line-through dark:text-zinc-400'
                  : 'break-words'
              }
            >
              {item.text}
            </span>
          </label>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`${item.text} を削除`}
            title={`${item.text} を削除`}
            className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
        </li>
      ))}
    </ul>
  )
}
