import { IconButton } from '@/components/icon-button'
import { TrashIcon } from '@/components/icons'

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

  // 1画面に収めるため、項目が多いときは一覧の中でスクロールさせる。
  // 広い画面では、中身の高さのまま、リストの枠（section）の残りの高さまで伸びる
  return (
    <ul className="flex max-h-112 flex-col gap-1 overflow-y-auto lg:max-h-none lg:min-h-0">
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
          <IconButton
            label={`${item.text} を削除`}
            icon={<TrashIcon />}
            onClick={() => onRemove(item.id)}
            variant="subtle"
          />
        </li>
      ))}
    </ul>
  )
}
