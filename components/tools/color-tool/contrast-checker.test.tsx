// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ContrastChecker } from './contrast-checker'

async function setColors(foreground: string, background: string) {
  const user = userEvent.setup()
  const fg = screen.getByLabelText('文字色')
  const bg = screen.getByLabelText('背景色')
  await user.clear(fg)
  if (foreground) await user.type(fg, foreground)
  await user.clear(bg)
  if (background) await user.type(bg, background)
}

// 基準の行（例: 「AA・通常の文字」）の合否の文言を返す
function verdictOf(criterion: string) {
  const item = screen
    .getAllByRole('listitem')
    .find((li) => li.textContent?.startsWith(criterion))
  return item?.textContent?.match(/(✓ 合格|✗ 不合格)/)?.[1]
}

describe('ContrastChecker', () => {
  it('既定では文字色 #000000・背景色 #ffffff で 21.00:1 を表示する', () => {
    render(<ContrastChecker />)
    expect(screen.getByLabelText('文字色')).toHaveValue('#000000')
    expect(screen.getByLabelText('背景色')).toHaveValue('#ffffff')
    expect(screen.getByText('21.00:1')).toBeInTheDocument()
  })

  it('色を変えると比が変わり、見本がその2色で表示される', async () => {
    render(<ContrastChecker />)
    await setColors('#777777', '#ffffff')
    expect(screen.getByText('4.47:1')).toBeInTheDocument()
    const sample = screen.getByText(/通常の文字の見本です/).parentElement
    expect(sample).toHaveStyle({
      color: '#777777',
      backgroundColor: '#ffffff',
    })
  })

  it('見本の文字を合否の一覧より上に表示する', () => {
    render(<ContrastChecker />)
    const sample = screen.getByText(/通常の文字の見本です/)
    const verdicts = screen.getByRole('list')
    expect(
      sample.compareDocumentPosition(verdicts) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('#767676 と白では AAA・通常の文字だけ不合格', async () => {
    render(<ContrastChecker />)
    await setColors('#767676', '#ffffff')
    expect(screen.getByText('4.54:1')).toBeInTheDocument()
    expect(verdictOf('AA・通常の文字')).toBe('✓ 合格')
    expect(verdictOf('AA・大きな文字')).toBe('✓ 合格')
    expect(verdictOf('AAA・通常の文字')).toBe('✗ 不合格')
    expect(verdictOf('AAA・大きな文字')).toBe('✓ 合格')
  })

  it('#777777 と白では AA・通常の文字が不合格、AA・大きな文字は合格', async () => {
    render(<ContrastChecker />)
    await setColors('#777777', '#ffffff')
    expect(verdictOf('AA・通常の文字')).toBe('✗ 不合格')
    expect(verdictOf('AA・大きな文字')).toBe('✓ 合格')
  })

  it('解釈できない色があると比と合否を出さず、入力中はエラーも出さない', async () => {
    render(<ContrastChecker />)
    await setColors('#000000', 'xyz')
    expect(screen.queryByText(/:1$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/合格/)).not.toBeInTheDocument()
    expect(screen.queryByText(/エラー/)).not.toBeInTheDocument()
  })

  it('フォーカスが外れると、解釈できない入力欄にだけエラーを出す', async () => {
    const user = userEvent.setup()
    render(<ContrastChecker />)
    await setColors('#000000', 'xyz')
    await user.tab()
    const error = screen.getByText('エラー: 背景色を色として解釈できません。')
    expect(screen.getByLabelText('背景色')).toHaveAccessibleDescription(
      error.textContent ?? '',
    )
    expect(screen.queryByText(/文字色を色として/)).not.toBeInTheDocument()
  })

  it('空の入力も解釈できない入力として扱う', async () => {
    const user = userEvent.setup()
    render(<ContrastChecker />)
    await user.clear(screen.getByLabelText('文字色'))
    await user.tab()
    expect(screen.queryByText(/:1$/)).not.toBeInTheDocument()
    expect(
      screen.getByText('エラー: 文字色を色として解釈できません。'),
    ).toBeInTheDocument()
  })
})
