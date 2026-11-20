// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JsonFormatter } from './json-formatter'

const SAMPLE = '{"a":1,"b":[true,null]}'

function setup() {
  const user = userEvent.setup()
  render(<JsonFormatter />)
  return {
    user,
    input: screen.getByLabelText('入力'),
    output: screen.getByRole('region', { name: '出力' }),
    indent: screen.getByLabelText('インデント'),
    format: screen.getByRole('button', { name: '整形' }),
    minify: screen.getByRole('button', { name: '圧縮' }),
  }
}

// user.type は { や [ を特殊キーとして解釈するため、貼り付けで入力する
async function paste(
  user: ReturnType<typeof userEvent.setup>,
  el: HTMLElement,
  text: string,
) {
  await user.click(el)
  await user.paste(text)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('JsonFormatter', () => {
  it('既定の2スペースで整形する', async () => {
    const { user, input, output, format } = setup()
    await paste(user, input, SAMPLE)
    await user.click(format)
    expect(output.textContent).toBe(
      '{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}',
    )
  })

  it('インデントにタブを選ぶとタブで整形する', async () => {
    const { user, input, output, indent, format } = setup()
    await paste(user, input, SAMPLE)
    await user.selectOptions(indent, 'タブ')
    await user.click(format)
    expect(output.textContent?.split('\n')[1]).toBe('\t"a": 1,')
  })

  it('圧縮すると1行になる', async () => {
    const { user, input, output, minify } = setup()
    await paste(user, input, '{\n  "a": 1,\n  "b": [true, null]\n}')
    await user.click(minify)
    expect(output.textContent).toBe(SAMPLE)
  })

  it('出力は編集できるテキスト欄ではなく、表示欄で表示する', () => {
    setup()
    expect(screen.queryByRole('textbox', { name: '出力' })).toBeNull()
    expect(screen.getByRole('region', { name: '出力' })).toBeInTheDocument()
  })

  it('不正な JSON ではエラーを表示し、出力を表示しない', async () => {
    const { user, input, output, format } = setup()
    await paste(user, input, SAMPLE)
    await user.click(format)
    await user.clear(input)
    await paste(user, input, '{"a":1,}')
    await user.click(format)

    expect(
      screen.getByText(/エラー: JSON の構文が正しくありません（1行目 8列目）/),
    ).toBeInTheDocument()
    expect(output.textContent).toBe('')
    expect(screen.getByRole('button', { name: 'コピー' })).toBeDisabled()
  })

  it('空入力ではエラーではなく入力を促すメッセージを表示する', async () => {
    const { user, format } = setup()
    await user.click(format)
    expect(screen.getByText('JSON を入力してください。')).toBeInTheDocument()
    expect(screen.queryByText(/エラー/)).not.toBeInTheDocument()
  })

  it('出力をコピーできる', async () => {
    const { user, input, format } = setup()
    await paste(user, input, '[1]')
    await user.click(format)
    await user.click(screen.getByRole('button', { name: 'コピー' }))
    expect(await navigator.clipboard.readText()).toBe('[\n  1\n]')
    expect(screen.getByText('コピーしました')).toBeInTheDocument()
  })

  it('入力・出力・設定を localStorage に保存しない', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { user, input, indent, format } = setup()
    await paste(user, input, SAMPLE)
    await user.selectOptions(indent, '4スペース')
    await user.click(format)
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })
})
