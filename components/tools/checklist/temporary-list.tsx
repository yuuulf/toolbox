import type { TemporaryItem } from '@/lib/tools/checklist'
import { AddItemForm } from './add-item-form'
import { CompletionCount } from './completion-count'
import { ItemList } from './item-list'

const TITLE = '一時'

type Props = {
  items: TemporaryItem[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onAdd: (text: string) => void
  onRemoveChecked: () => void
}

export function TemporaryList({
  items,
  onToggle,
  onRemove,
  onAdd,
  onRemoveChecked,
}: Props) {
  const done = items.filter((item) => item.checked).length

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{TITLE}</h2>
        <CompletionCount done={done} total={items.length} />
      </div>
      <ItemList items={items} onToggle={onToggle} onRemove={onRemove} />
      <AddItemForm listLabel={TITLE} itemCount={items.length} onAdd={onAdd} />
      <div>
        <button
          type="button"
          onClick={onRemoveChecked}
          disabled={done === 0}
          className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-semibold hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          チェック済みを削除
        </button>
      </div>
    </section>
  )
}
