import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChecklistData } from './checklist'
import {
  CHECKLIST_KEY,
  EMPTY_CHECKLIST,
  MAX_ITEMS,
  MAX_TEXT_LENGTH,
  addItem,
  isChecked,
  loadChecklist,
  pruneChecks,
  removeCheckedTemporary,
  removeItem,
  saveChecklist,
  toggleCheck,
  toggleTemporary,
} from './checklist'

const TODAY = new Date(2026, 10, 18)

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

function added(
  data: ChecklistData,
  list: Parameters<typeof addItem>[1],
  text: string,
) {
  const result = addItem(data, list, text)
  if (!result.ok) throw new Error(`追加できませんでした: ${result.reason}`)
  return result.data
}

function withItems(list: 'monthly' | 'weekly' | 'daily', count: number) {
  let data = EMPTY_CHECKLIST
  for (let i = 0; i < count; i++) data = added(data, list, `項目${i}`)
  return data
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('addItem', () => {
  it('前後の空白を取り除いて末尾に加える', () => {
    let data = added(EMPTY_CHECKLIST, 'weekly', '週報を書く')
    data = added(data, 'weekly', '  振り返り  ')
    expect(data.weekly.items.map((item) => item.text)).toEqual([
      '週報を書く',
      '振り返り',
    ])
    expect(data.weekly.items[0].id).not.toBe(data.weekly.items[1].id)
  })

  it('一時のリストの項目は未チェックで加わる', () => {
    const data = added(EMPTY_CHECKLIST, 'temporary', '牛乳を買う')
    expect(data.temporary.items[0]).toMatchObject({
      text: '牛乳を買う',
      checked: false,
    })
  })

  it('空または空白のみは追加しない', () => {
    expect(addItem(EMPTY_CHECKLIST, 'daily', '   ')).toEqual({
      ok: false,
      reason: 'empty',
    })
  })

  it(`${MAX_TEXT_LENGTH + 1} 文字は追加しない`, () => {
    expect(
      addItem(EMPTY_CHECKLIST, 'daily', 'あ'.repeat(MAX_TEXT_LENGTH + 1)),
    ).toEqual({ ok: false, reason: 'too-long' })
    expect(
      addItem(EMPTY_CHECKLIST, 'daily', 'あ'.repeat(MAX_TEXT_LENGTH)).ok,
    ).toBe(true)
  })

  it(`${MAX_ITEMS + 1} 件目は追加しない`, () => {
    expect(addItem(withItems('monthly', MAX_ITEMS), 'monthly', '追加')).toEqual(
      { ok: false, reason: 'full' },
    )
  })
})

describe('チェック', () => {
  it('期間ごとに別のチェックになる', () => {
    let data = added(EMPTY_CHECKLIST, 'daily', 'メールを確認')
    const id = data.daily.items[0].id
    data = toggleCheck(data, 'daily', '2026-11-18', id)
    expect(isChecked(data, 'daily', '2026-11-18', id)).toBe(true)
    expect(isChecked(data, 'daily', '2026-11-19', id)).toBe(false)
  })

  it('もう一度切り替えると外れ、空の期間はキーごと消える', () => {
    let data = added(EMPTY_CHECKLIST, 'daily', 'メールを確認')
    const id = data.daily.items[0].id
    data = toggleCheck(data, 'daily', '2026-11-18', id)
    data = toggleCheck(data, 'daily', '2026-11-18', id)
    expect(data.daily.checks).toEqual({})
  })

  it('一時のリストのチェックを切り替え、チェック済みをまとめて削除する', () => {
    let data = added(EMPTY_CHECKLIST, 'temporary', 'A')
    data = added(data, 'temporary', 'B')
    data = added(data, 'temporary', 'C')
    data = toggleTemporary(data, data.temporary.items[0].id)
    data = toggleTemporary(data, data.temporary.items[2].id)
    expect(
      removeCheckedTemporary(data).temporary.items.map((item) => item.text),
    ).toEqual(['B'])
  })
})

describe('removeItem', () => {
  it('繰り返しのリストでは全期間のチェックからも消える', () => {
    let data = added(EMPTY_CHECKLIST, 'weekly', '週報を書く')
    data = added(data, 'weekly', '振り返り')
    const [a, b] = data.weekly.items.map((item) => item.id)
    data = toggleCheck(data, 'weekly', '2026-11-09', a)
    data = toggleCheck(data, 'weekly', '2026-11-16', a)
    data = toggleCheck(data, 'weekly', '2026-11-16', b)

    data = removeItem(data, 'weekly', a)
    expect(data.weekly.items.map((item) => item.text)).toEqual(['振り返り'])
    expect(data.weekly.checks).toEqual({ '2026-11-16': [b] })
  })

  it('一時のリストの項目を削除する', () => {
    const data = added(EMPTY_CHECKLIST, 'temporary', 'A')
    expect(
      removeItem(data, 'temporary', data.temporary.items[0].id).temporary.items,
    ).toEqual([])
  })
})

describe('pruneChecks', () => {
  it('残す範囲より古い期間の記録を削除し、項目は残す', () => {
    let data = added(EMPTY_CHECKLIST, 'daily', 'メールを確認')
    data = added(data, 'monthly', '請求処理')
    const daily = data.daily.items[0].id
    const monthly = data.monthly.items[0].id
    data = toggleCheck(data, 'daily', '2026-08-19', daily)
    data = toggleCheck(data, 'daily', '2026-08-21', daily)
    data = toggleCheck(data, 'monthly', '2024-11', monthly)
    data = toggleCheck(data, 'monthly', '2024-12', monthly)

    const pruned = pruneChecks(data, TODAY)
    expect(Object.keys(pruned.daily.checks)).toEqual(['2026-08-21'])
    expect(Object.keys(pruned.monthly.checks)).toEqual(['2024-12'])
    expect(pruned.daily.items).toEqual(data.daily.items)
    expect(pruned.monthly.items).toEqual(data.monthly.items)
  })
})

describe('loadChecklist / saveChecklist', () => {
  it('保存した内容を読み込む', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    let data = added(EMPTY_CHECKLIST, 'daily', 'メールを確認')
    data = toggleCheck(data, 'daily', '2026-11-18', data.daily.items[0].id)
    saveChecklist(data)
    expect(loadChecklist()).toEqual(data)
  })

  it('保存値がなければ空のデータ', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    expect(loadChecklist()).toEqual(EMPTY_CHECKLIST)
  })

  it.each([
    ['壊れた JSON', '{broken'],
    ['配列', '[]'],
    ['リストが足りない', JSON.stringify({ monthly: EMPTY_CHECKLIST.monthly })],
    [
      '期間キーの書式違い',
      JSON.stringify({
        ...EMPTY_CHECKLIST,
        monthly: { items: [], checks: { '2026-11-01': [] } },
      }),
    ],
    [
      '空の項目',
      JSON.stringify({
        ...EMPTY_CHECKLIST,
        daily: { items: [{ id: 'a', text: ' ' }], checks: {} },
      }),
    ],
    [
      '上限超えの項目数',
      JSON.stringify({
        ...EMPTY_CHECKLIST,
        daily: {
          items: Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({
            id: `id${i}`,
            text: 'x',
          })),
          checks: {},
        },
      }),
    ],
    [
      'checked のない一時の項目',
      JSON.stringify({
        ...EMPTY_CHECKLIST,
        temporary: { items: [{ id: 'a', text: 'x' }] },
      }),
    ],
  ])('不正な保存値（%s）は空のデータとして扱う', (_, raw) => {
    vi.stubGlobal('localStorage', memoryStorage({ [CHECKLIST_KEY]: raw }))
    expect(loadChecklist()).toEqual(EMPTY_CHECKLIST)
  })

  it('項目にない ID のチェックは読み込み時に取り除く', () => {
    const stored: ChecklistData = {
      ...EMPTY_CHECKLIST,
      daily: {
        items: [{ id: 'a', text: 'メールを確認' }],
        checks: { '2026-11-18': ['a', 'ghost'], '2026-11-17': ['ghost'] },
      },
    }
    vi.stubGlobal(
      'localStorage',
      memoryStorage({ [CHECKLIST_KEY]: JSON.stringify(stored) }),
    )
    expect(loadChecklist().daily.checks).toEqual({ '2026-11-18': ['a'] })
  })

  it('localStorage が例外を投げても空のデータを返し、保存しても例外を投げない', () => {
    const fail = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    vi.stubGlobal('localStorage', { getItem: fail, setItem: fail })
    expect(loadChecklist()).toEqual(EMPTY_CHECKLIST)
    expect(() => saveChecklist(EMPTY_CHECKLIST)).not.toThrow()
  })
})
