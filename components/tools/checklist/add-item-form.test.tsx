// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddItemForm } from './add-item-form'

function setup(itemCount = 0) {
  const onAdd = vi.fn()
  render(<AddItemForm listLabel="週次" itemCount={itemCount} onAdd={onAdd} />)
  return { onAdd, user: userEvent.setup() }
}

const input = () => screen.getByLabelText('週次の項目')
const addButton = () => screen.getByRole('button', { name: '追加' })

describe('AddItemForm', () => {
  it('「追加」で onAdd に入力が渡り、入力欄が空になる', async () => {
    const { onAdd, user } = setup()
    await user.type(input(), '週報を書く')
    await user.click(addButton())
    expect(onAdd).toHaveBeenCalledWith('週報を書く')
    expect(input()).toHaveValue('')
  })

  it('Enter キーでも追加できる', async () => {
    const { onAdd, user } = setup()
    await user.type(input(), 'メールを確認{Enter}')
    expect(onAdd).toHaveBeenCalledWith('メールを確認')
  })

  it('空または空白のみのときは押せず、Enter でも追加しない', async () => {
    const { onAdd, user } = setup()
    expect(addButton()).toBeDisabled()
    await user.type(input(), '   {Enter}')
    expect(addButton()).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('上限のときは押せず、上限の案内を出す', async () => {
    const { onAdd, user } = setup(30)
    await user.type(input(), '追加したい{Enter}')
    expect(addButton()).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByText('項目は30件までです。')).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  it('入力欄は 100 文字までに制限する', () => {
    setup()
    expect(input()).toHaveAttribute('maxLength', '100')
  })
})
