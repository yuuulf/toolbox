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
    // 広い画面では、30件のときの高さ（一覧が max-h-112）を最低にして、画面の下端まで広がる。
    // 一覧はこの中で中身の高さのまま伸び、追加の入力欄は一覧のすぐ下に来る
    <section className="flex flex-col gap-3 lg:min-h-159 lg:contain-size">
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
