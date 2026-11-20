// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'toolbox:id-generator:password-options'
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

// 設定ストアはモジュール内に状態を持つため、テストごとに読み込み直して初期化する
async function setup() {
  vi.resetModules()
  const { IdGenerator } = await import('./id-generator')
  const user = userEvent.setup()
  render(<IdGenerator />)
  return { user }
}

const passwordText = () =>
  screen.getByRole('region', { name: '生成したパスワード' }).textContent ?? ''
const uuidText = () =>
  screen.getByRole('region', { name: '生成結果' }).textContent ?? ''

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('UUID', () => {
  it('指定した個数の UUID を1行ずつ表示する', async () => {
    const { user } = await setup()
    const count = screen.getByLabelText('個数')
    await user.clear(count)
    await user.type(count, '5')
    await user.click(screen.getByRole('button', { name: 'UUID を生成' }))

    const lines = uuidText().split('\n')
    expect(lines).toHaveLength(5)
    expect(new Set(lines).size).toBe(5)
    for (const line of lines) expect(line).toMatch(UUID_V4)
  })

  it('生成結果は1行に1件ずつ表示し、初期表示と1件のときは1行になる', async () => {
    const { user } = await setup()
    expect(uuidText().split('\n')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'UUID を生成' }))
    expect(uuidText().split('\n')).toHaveLength(1)

    const count = screen.getByLabelText('個数')
    await user.clear(count)
    await user.type(count, '5')
    await user.click(screen.getByRole('button', { name: 'UUID を生成' }))
    expect(uuidText().split('\n')).toHaveLength(5)
  })

  it('生成結果とパスワードは編集できるテキスト欄ではなく、表示欄で表示する', async () => {
    await setup()
    for (const name of ['生成結果', '生成したパスワード']) {
      expect(screen.queryByRole('textbox', { name })).toBeNull()
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
  })

  it('範囲外の個数では生成できず、範囲を案内する', async () => {
    const { user } = await setup()
    const count = screen.getByLabelText('個数')
    for (const value of ['0', '101']) {
      await user.clear(count)
      await user.type(count, value)
      expect(
        screen.getByText('個数は 1〜100 の範囲で指定してください。'),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'UUID を生成' })).toBeDisabled()
    }
  })

  it('生成した UUID をすべて改行区切りでコピーできる', async () => {
    const { user } = await setup()
    const count = screen.getByLabelText('個数')
    await user.clear(count)
    await user.type(count, '3')
    await user.click(screen.getByRole('button', { name: 'UUID を生成' }))
    await user.click(screen.getByRole('button', { name: 'UUID をコピー' }))

    const lines = (await navigator.clipboard.readText()).split('\n')
    expect(lines).toHaveLength(3)
    for (const line of lines) expect(line).toMatch(UUID_V4)
    expect(screen.getByText('コピーしました')).toBeInTheDocument()
  })
})

describe('パスワード', () => {
  it('既定設定で16文字のパスワードを生成し、コピーできる', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'パスワードを生成' }))
    expect(passwordText()).toHaveLength(16)

    await user.click(screen.getByRole('button', { name: 'パスワードをコピー' }))
    expect(await navigator.clipboard.readText()).toBe(passwordText())
    expect(screen.getByText('コピーしました')).toBeInTheDocument()
  })

  it('文字種をすべて外すと生成できず、選ぶよう案内する', async () => {
    const { user } = await setup()
    for (const name of [
      '英大文字（A-Z）',
      '英小文字（a-z）',
      '数字（0-9）',
      '記号',
    ]) {
      await user.click(screen.getByRole('checkbox', { name }))
    }
    expect(
      screen.getByText('文字種を1つ以上選んでください。'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'パスワードを生成' }),
    ).toBeDisabled()
  })

  it('範囲外の長さでは生成できず、範囲を案内する', async () => {
    const { user } = await setup()
    const length = screen.getByLabelText('長さ')
    await user.clear(length)
    await user.type(length, '3')
    expect(
      screen.getByText('長さは 4〜128 の範囲で指定してください。'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'パスワードを生成' }),
    ).toBeDisabled()
  })
})

describe('設定の保存', () => {
  it('変更した長さと文字種を localStorage に保存する', async () => {
    const { user } = await setup()
    const length = screen.getByLabelText('長さ')
    await user.clear(length)
    await user.type(length, '24')
    await user.click(screen.getByRole('checkbox', { name: '記号' }))

    expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual({
      length: 24,
      upper: true,
      lower: true,
      digits: true,
      symbols: false,
    })
  })

  it('保存済みの設定を復元する', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        length: 24,
        upper: true,
        lower: true,
        digits: true,
        symbols: false,
      }),
    )
    await setup()
    expect(screen.getByLabelText('長さ')).toHaveValue(24)
    expect(screen.getByRole('checkbox', { name: '記号' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: '数字（0-9）' })).toBeChecked()
  })

  it('生成した値は localStorage に保存しない', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'UUID を生成' }))
    await user.click(screen.getByRole('button', { name: 'パスワードを生成' }))
    await user.click(screen.getByRole('checkbox', { name: '記号' }))

    const uuid = uuidText()
    const stored = Object.keys(localStorage).map((k) => localStorage.getItem(k))
    expect(Object.keys(localStorage)).toEqual([KEY])
    expect(stored.join('')).not.toContain(passwordText())
    expect(stored.join('')).not.toContain(uuid)
  })

  it('localStorage が例外を投げても既定値で表示し、操作できる', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    const { user } = await setup()

    expect(screen.getByLabelText('長さ')).toHaveValue(16)
    await user.click(screen.getByRole('checkbox', { name: '記号' }))
    expect(screen.getByRole('checkbox', { name: '記号' })).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'パスワードを生成' }))
    expect(passwordText()).toMatch(/^[A-Za-z0-9]{16}$/)
  })
})
