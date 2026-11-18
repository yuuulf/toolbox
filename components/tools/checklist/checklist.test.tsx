// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'toolbox:checklist:data'

// ストアと「今日」はモジュール内に状態を持つため、テストごとに読み込み直して初期化する
async function setup() {
  vi.resetModules()
  const { Checklist } = await import('./checklist')
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const view = render(<Checklist />)
  return { user, view }
}

const listOf = (title: string) =>
  within(
    screen
      .getByRole('heading', { name: title })
      .closest('section') as HTMLElement,
  )

function stored() {
  return JSON.parse(localStorage.getItem(KEY) ?? 'null')
}

beforeEach(() => {
  localStorage.clear()
  // 2026-11-18（水）に固定する
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 10, 18, 9, 0))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Checklist', () => {
  it('4つのリストを見出し付きで表示する', async () => {
    await setup()
    for (const name of ['月次', '週次', '日次', '一時']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
  })

  it('期間の初期値は今月・今週・今日', async () => {
    await setup()
    expect(listOf('月次').getByLabelText('月')).toHaveValue('2026-11')
    expect(
      listOf('週次').getByText('11/16（月）〜11/22（日）'),
    ).toBeInTheDocument()
    expect(listOf('日次').getByLabelText('日')).toHaveValue('2026-11-18')
  })

  it('再読み込みすると項目とチェックが復元され、選んでいた期間は今日に戻る', async () => {
    const first = await setup()
    await first.user.type(
      listOf('日次').getByLabelText('日次の項目'),
      'メールを確認{Enter}',
    )
    await first.user.click(
      listOf('日次').getByRole('checkbox', { name: 'メールを確認' }),
    )
    fireEvent.change(listOf('日次').getByLabelText('日'), {
      target: { value: '2026-11-10' },
    })
    first.view.unmount()

    await setup()
    expect(listOf('日次').getByLabelText('日')).toHaveValue('2026-11-18')
    expect(
      listOf('日次').getByRole('checkbox', { name: 'メールを確認' }),
    ).toBeChecked()
  })

  it('保存値が壊れていても、項目のない状態で表示する', async () => {
    localStorage.setItem(KEY, '{broken')
    await setup()
    expect(screen.getAllByText('項目はまだありません。')).toHaveLength(4)
  })

  it('localStorage が例外を投げても、このページ内では操作できる', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    const { user } = await setup()
    await user.type(
      listOf('一時').getByLabelText('一時の項目'),
      '牛乳を買う{Enter}',
    )
    await user.click(
      listOf('一時').getByRole('checkbox', { name: '牛乳を買う' }),
    )
    expect(
      listOf('一時').getByRole('checkbox', { name: '牛乳を買う' }),
    ).toBeChecked()
  })

  it('繰り返しのリストで項目を削除すると、ほかの期間からも消える', async () => {
    const { user } = await setup()
    await user.type(
      listOf('週次').getByLabelText('週次の項目'),
      '週報を書く{Enter}',
    )
    await user.click(
      listOf('週次').getByRole('checkbox', { name: '週報を書く' }),
    )
    await user.click(
      listOf('週次').getByRole('button', { name: '週報を書く を削除' }),
    )

    fireEvent.change(listOf('週次').getByLabelText('週'), {
      target: { value: '2026-11-25' },
    })
    expect(
      listOf('週次').queryByRole('checkbox', { name: '週報を書く' }),
    ).not.toBeInTheDocument()
    expect(stored().weekly).toEqual({ items: [], checks: {} })
  })

  it('保存するとき、残す範囲より古いチェックの記録を削除し、項目は残す', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        monthly: { items: [], checks: {} },
        weekly: { items: [], checks: {} },
        daily: {
          items: [{ id: 'a', text: 'メールを確認' }],
          checks: { '2026-08-19': ['a'], '2026-08-21': ['a'] },
        },
        temporary: { items: [] },
      }),
    )
    const { user } = await setup()
    // 読み込んだだけでは保存値を書き換えない
    expect(Object.keys(stored().daily.checks)).toEqual([
      '2026-08-19',
      '2026-08-21',
    ])

    await user.click(
      listOf('日次').getByRole('checkbox', { name: 'メールを確認' }),
    )
    expect(Object.keys(stored().daily.checks).sort()).toEqual([
      '2026-08-21',
      '2026-11-18',
    ])
    expect(stored().daily.items).toEqual([{ id: 'a', text: 'メールを確認' }])
  })

  it('選んでいる期間は保存しない', async () => {
    await setup()
    fireEvent.change(listOf('月次').getByLabelText('月'), {
      target: { value: '2026-10' },
    })
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})
