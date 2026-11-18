'use client'

import { useSyncExternalStore } from 'react'
import type { ChecklistData, ListKind } from '@/lib/tools/checklist'
import {
  EMPTY_CHECKLIST,
  RECURRING_KINDS,
  addItem,
  loadChecklist,
  pruneChecks,
  removeCheckedTemporary,
  removeItem,
  saveChecklist,
  toggleCheck,
  toggleTemporary,
} from '@/lib/tools/checklist'
import { RecurringList } from './recurring-list'
import { TemporaryList } from './temporary-list'

// localStorage はプリレンダー時に読めないため、サーバーでは空のデータを返し、
// ブラウザで初めて読むときに復元する（カラーツールのお気に入りと同じ仕組み）
const listeners = new Set<() => void>()
let currentData: ChecklistData | undefined

const checklistStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot(): ChecklistData {
    currentData ??= loadChecklist()
    return currentData
  },
  getServerSnapshot(): ChecklistData {
    return EMPTY_CHECKLIST
  },
  set(next: ChecklistData) {
    // 古いチェックの記録は保存のたびに現在時刻で判定して消す（読み込みだけでは保存値を書き換えない）。
    // 保存に失敗しても、メモリ上のデータでこのページ内の操作は続けられる
    currentData = pruneChecks(next, new Date())
    saveChecklist(currentData)
    listeners.forEach((listener) => listener())
  },
}

// 「今日」はブラウザでだけ決める。ページはビルド時にプリレンダーされるため、
// サーバー側で決めるとビルドした日の日付が HTML に入ってしまう
let openedAt: Date | undefined
const noopSubscribe = () => () => {}

function useToday(): Date | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => (openedAt ??= new Date()),
    () => null,
  )
}

const LIST_TITLES: Record<ListKind, string> = {
  monthly: '月次',
  weekly: '週次',
  daily: '日次',
  temporary: '一時',
}

export function Checklist() {
  const data = useSyncExternalStore(
    checklistStore.subscribe,
    checklistStore.getSnapshot,
    checklistStore.getServerSnapshot,
  )
  const today = useToday()
  const update = checklistStore.set

  function handleAdd(list: ListKind, text: string) {
    const result = addItem(data, list, text)
    if (result.ok) update(result.data)
  }

  return (
    // 1470×800 に収めるため、xl では4列に並べる（各リストの一覧は中でスクロールする）
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-6 xl:grid-cols-4">
      {today === null
        ? // プリレンダーした HTML では日付が決まらないので、見出しだけの枠を出す
          (Object.keys(LIST_TITLES) as ListKind[]).map((list) => (
            <section key={list} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{LIST_TITLES[list]}</h2>
            </section>
          ))
        : [
            ...RECURRING_KINDS.map((kind) => (
              <RecurringList
                key={kind}
                kind={kind}
                list={data[kind]}
                today={today}
                onToggle={(period, id) =>
                  update(toggleCheck(data, kind, period, id))
                }
                onRemove={(id) => update(removeItem(data, kind, id))}
                onAdd={(text) => handleAdd(kind, text)}
              />
            )),
            <TemporaryList
              key="temporary"
              items={data.temporary.items}
              onToggle={(id) => update(toggleTemporary(data, id))}
              onRemove={(id) => update(removeItem(data, 'temporary', id))}
              onAdd={(text) => handleAdd('temporary', text)}
              onRemoveChecked={() => update(removeCheckedTemporary(data))}
            />,
          ]}
    </div>
  )
}
