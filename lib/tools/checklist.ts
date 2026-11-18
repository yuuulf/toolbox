import { readJson, writeJson } from '@/lib/storage'
import type { RecurringKind } from './checklist-period'
import { isDayKey, isMonthKey, isRetained } from './checklist-period'
import { randomUuid } from './id-generate'

export const CHECKLIST_KEY = 'toolbox:checklist:data'
export const MAX_ITEMS = 30
export const MAX_TEXT_LENGTH = 100

export const RECURRING_KINDS: readonly RecurringKind[] = [
  'monthly',
  'weekly',
  'daily',
]

export type Item = { id: string; text: string }
export type TemporaryItem = Item & { checked: boolean }

export type RecurringList = {
  items: Item[]
  /** 期間のキー → チェック済みの項目 ID */
  checks: Record<string, string[]>
}

export type ChecklistData = Record<RecurringKind, RecurringList> & {
  temporary: { items: TemporaryItem[] }
}

export type ListKind = RecurringKind | 'temporary'

export type AddResult =
  | { ok: true; data: ChecklistData }
  | { ok: false; reason: 'empty' | 'too-long' | 'full' }

export const EMPTY_CHECKLIST: ChecklistData = {
  monthly: { items: [], checks: {} },
  weekly: { items: [], checks: {} },
  daily: { items: [], checks: {} },
  temporary: { items: [] },
}

// ---- 項目の操作（すべて新しい値を返す） ----

export function addItem(
  data: ChecklistData,
  list: ListKind,
  text: string,
): AddResult {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: false, reason: 'empty' }
  if (trimmed.length > MAX_TEXT_LENGTH) return { ok: false, reason: 'too-long' }
  if (data[list].items.length >= MAX_ITEMS) return { ok: false, reason: 'full' }

  const item: Item = { id: randomUuid(), text: trimmed }
  if (list === 'temporary') {
    return {
      ok: true,
      data: {
        ...data,
        temporary: {
          items: [...data.temporary.items, { ...item, checked: false }],
        },
      },
    }
  }
  return {
    ok: true,
    data: {
      ...data,
      [list]: { ...data[list], items: [...data[list].items, item] },
    },
  }
}

/** 繰り返しのリストでは、その項目の全期間のチェックも削除する */
export function removeItem(
  data: ChecklistData,
  list: ListKind,
  id: string,
): ChecklistData {
  if (list === 'temporary') {
    return {
      ...data,
      temporary: {
        items: data.temporary.items.filter((item) => item.id !== id),
      },
    }
  }
  const { items, checks } = data[list]
  return {
    ...data,
    [list]: {
      items: items.filter((item) => item.id !== id),
      checks: mapChecks(checks, (ids) =>
        ids.filter((checked) => checked !== id),
      ),
    },
  }
}

export function isChecked(
  data: ChecklistData,
  list: RecurringKind,
  period: string,
  id: string,
): boolean {
  return data[list].checks[period]?.includes(id) ?? false
}

export function toggleCheck(
  data: ChecklistData,
  list: RecurringKind,
  period: string,
  id: string,
): ChecklistData {
  const current = data[list].checks[period] ?? []
  const next = current.includes(id)
    ? current.filter((checked) => checked !== id)
    : [...current, id]
  const checks = { ...data[list].checks }
  // 空になった期間はキーごと消し、保存値を小さく保つ
  if (next.length === 0) delete checks[period]
  else checks[period] = next
  return { ...data, [list]: { ...data[list], checks } }
}

export function toggleTemporary(
  data: ChecklistData,
  id: string,
): ChecklistData {
  return {
    ...data,
    temporary: {
      items: data.temporary.items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    },
  }
}

export function removeCheckedTemporary(data: ChecklistData): ChecklistData {
  return {
    ...data,
    temporary: { items: data.temporary.items.filter((item) => !item.checked) },
  }
}

/** 残す範囲より古い期間のチェックを削除する。項目は変えない */
export function pruneChecks(data: ChecklistData, today: Date): ChecklistData {
  const next = { ...data }
  for (const kind of RECURRING_KINDS) {
    const checks = Object.fromEntries(
      Object.entries(data[kind].checks).filter(([key]) =>
        isRetained(kind, key, today),
      ),
    )
    next[kind] = { ...data[kind], checks }
  }
  return next
}

function mapChecks(
  checks: Record<string, string[]>,
  map: (ids: string[]) => string[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [key, ids] of Object.entries(checks)) {
    const next = map(ids)
    if (next.length > 0) result[key] = next
  }
  return result
}

// ---- 保存値の検証と読み書き（localStorage） ----

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isItem(value: unknown): value is Item {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.text === 'string' &&
    value.text.trim() !== '' &&
    value.text.length <= MAX_TEXT_LENGTH
  )
}

function isItemList(value: unknown): value is unknown[] {
  return (
    Array.isArray(value) && value.length <= MAX_ITEMS && value.every(isItem)
  )
}

function isRecurringList(
  value: unknown,
  isKey: (key: string) => boolean,
): value is RecurringList {
  if (!isRecord(value) || !isItemList(value.items) || !isRecord(value.checks)) {
    return false
  }
  return Object.entries(value.checks).every(
    ([key, ids]) =>
      isKey(key) &&
      Array.isArray(ids) &&
      ids.every((id) => typeof id === 'string'),
  )
}

export function isChecklistData(value: unknown): value is ChecklistData {
  return (
    isRecord(value) &&
    isRecurringList(value.monthly, isMonthKey) &&
    isRecurringList(value.weekly, isDayKey) &&
    isRecurringList(value.daily, isDayKey) &&
    isRecord(value.temporary) &&
    isItemList(value.temporary.items) &&
    value.temporary.items.every(
      (item) => isRecord(item) && typeof item.checked === 'boolean',
    )
  )
}

/** 項目にない ID のチェックを取り除く（手で編集された保存値などへの備え） */
function dropUnknownChecks(data: ChecklistData): ChecklistData {
  const next = { ...data }
  for (const kind of RECURRING_KINDS) {
    const ids = new Set(data[kind].items.map((item) => item.id))
    next[kind] = {
      ...data[kind],
      checks: mapChecks(data[kind].checks, (checked) =>
        checked.filter((id) => ids.has(id)),
      ),
    }
  }
  return next
}

export function loadChecklist(): ChecklistData {
  return dropUnknownChecks(
    readJson(CHECKLIST_KEY, isChecklistData, EMPTY_CHECKLIST),
  )
}

export function saveChecklist(data: ChecklistData): void {
  writeJson(CHECKLIST_KEY, data)
}
