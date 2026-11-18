// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ColorField } from './color-field'

const MESSAGE = 'エラー: 文字色を色として解釈できません。'

function Controlled({
  initial = '',
  allowEmpty,
}: {
  initial?: string
  allowEmpty?: boolean
}) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <ColorField
        label="文字色"
        value={value}
        onChange={setValue}
        invalidMessage={MESSAGE}
        allowEmpty={allowEmpty}
      />
      <button type="button">ほかの場所</button>
    </>
  )
}

const textInput = () => screen.getByLabelText('文字色')
const picker = () =>
  screen.getByLabelText('文字色をカラーピッカーで選ぶ') as HTMLInputElement

describe('ColorField', () => {
  it('入力欄とピッカーをラベルで取得できる', () => {
    render(<Controlled />)
    expect(textInput()).toHaveAttribute('type', 'text')
    expect(picker()).toHaveAttribute('type', 'color')
  })

  it('ピッカーで選ぶと onChange に HEX が渡る', () => {
    const onChange = vi.fn()
    render(
      <ColorField
        label="文字色"
        value=""
        onChange={onChange}
        invalidMessage={MESSAGE}
      />,
    )
    fireEvent.input(picker(), { target: { value: '#336699' } })
    expect(onChange).toHaveBeenCalledWith('#336699')
  })

  it('ピッカーで選ぶと入力欄が HEX に置き換わる', () => {
    render(<Controlled initial="rgb(0, 0, 0)" />)
    fireEvent.input(picker(), { target: { value: '#336699' } })
    expect(textInput()).toHaveValue('#336699')
  })

  it('入力を解釈できるとき、ピッカーはその色を示す', () => {
    render(<Controlled initial="rgb(255, 0, 0)" />)
    expect(picker().value).toBe('#ff0000')
  })

  it('入力を解釈できない間、ピッカーは直前の色のままになる', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="#336699" />)
    await user.clear(textInput())
    await user.type(textInput(), 'rgb(')
    expect(picker().value).toBe('#336699')
  })

  it('一度も解釈できていないとき、ピッカーは黒を示す', () => {
    render(<Controlled />)
    expect(picker().value).toBe('#000000')
  })
})

describe('ColorField のエラー表示', () => {
  it('入力中は解釈できなくてもエラーを出さない', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="#000000" />)
    await user.clear(textInput())
    await user.type(textInput(), 'rgb(')
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
    expect(textInput()).toHaveAttribute('aria-invalid', 'false')
  })

  it('フォーカスが外れたとき解釈できなければエラーを出し、入力欄と結びつける', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="#000000" />)
    await user.clear(textInput())
    await user.type(textInput(), 'abc-xyz')
    await user.tab()

    const error = screen.getByText(MESSAGE)
    expect(error).toHaveAttribute('aria-live', 'polite')
    expect(textInput()).toHaveAttribute('aria-invalid', 'true')
    expect(textInput()).toHaveAccessibleDescription(MESSAGE)
  })

  it('フォーカスが外れても解釈できればエラーを出さない', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="" />)
    await user.type(textInput(), '#ff0000')
    await user.tab()
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })

  it('エラーの表示中に入力を再開するとエラーが消え、外れたら改めて判定する', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="xyz" />)
    await user.click(textInput())
    await user.tab()
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()

    await user.click(textInput())
    await user.type(textInput(), 'w')
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ほかの場所' }))
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
  })

  it('allowEmpty のときは空のままフォーカスが外れてもエラーを出さない', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="" allowEmpty />)
    await user.click(textInput())
    await user.tab()
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })

  it('allowEmpty でなければ空のままフォーカスが外れるとエラーを出す', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="" />)
    await user.click(textInput())
    await user.tab()
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
  })

  it('ピッカーで選んだときはエラーを出さない', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="xyz" />)
    await user.click(textInput())
    await user.tab()
    fireEvent.input(picker(), { target: { value: '#336699' } })
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })
})
