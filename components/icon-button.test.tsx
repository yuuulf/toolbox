// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IconButton } from './icon-button'
import { PlusIcon } from './icons'

describe('IconButton', () => {
  it('文字を表示せず、label が名前とツールチップになる', () => {
    render(<IconButton label="追加" icon={<PlusIcon />} />)
    const button = screen.getByRole('button', { name: '追加' })
    expect(button.textContent).toBe('')
    expect(button.getAttribute('title')).toBe('追加')
    expect(button.querySelector('svg[data-icon="plus"]')).not.toBeNull()
  })

  it('disabled のときは押せない', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <IconButton
        label="追加"
        icon={<PlusIcon />}
        onClick={onClick}
        disabled
      />,
    )
    const button = screen.getByRole('button', {
      name: '追加',
    }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('クリックと Enter / Space で onClick が呼ばれる', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton label="追加" icon={<PlusIcon />} onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: '追加' }))
    await user.tab()
    await user.tab({ shift: true })
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  it('outline は CopyButton の既定と同じ枠ありの見た目になる', () => {
    render(<IconButton label="追加" icon={<PlusIcon />} variant="outline" />)
    expect(screen.getByRole('button', { name: '追加' }).className).toContain(
      'border-zinc-300',
    )
  })

  it('type="submit" でフォームを送信できる', () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) =>
      e.preventDefault(),
    )
    render(
      <form onSubmit={onSubmit}>
        <IconButton label="追加" icon={<PlusIcon />} type="submit" />
      </form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
