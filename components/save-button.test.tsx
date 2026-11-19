// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SaveButton } from './save-button'

afterEach(() => {
  vi.useRealTimers()
})

const button = () => screen.getByRole('button', { name: '保存' })
const icon = () => button().querySelector('svg')?.dataset.icon

describe('SaveButton', () => {
  it('文字を表示せず、保存のアイコンと名前・ツールチップを持つ', () => {
    render(<SaveButton onSave={() => true} />)
    expect(button().textContent).toBe('')
    expect(button().getAttribute('title')).toBe('保存')
    expect(icon()).toBe('save')
  })

  it('保存できたら ✓ に変わって「保存しました」を読み上げ、約2秒で元に戻る', () => {
    vi.useFakeTimers()
    const onSave = vi.fn(() => true)
    render(<SaveButton onSave={onSave} />)
    fireEvent.click(button())
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(icon()).toBe('check')
    const live = screen.getByText('保存しました')
    expect(live.getAttribute('aria-live')).toBe('polite')
    expect(live.className).toContain('sr-only')

    act(() => vi.advanceTimersByTime(2000))
    expect(icon()).toBe('save')
    expect(screen.queryByText('保存しました')).toBeNull()
  })

  it('保存できなかったら × に変わって「保存できませんでした」を読み上げる', () => {
    render(<SaveButton onSave={() => false} />)
    fireEvent.click(button())
    expect(icon()).toBe('cross')
    expect(screen.getByText('保存できませんでした').className).toContain(
      'sr-only',
    )
  })

  it('disabled のときは押せない', () => {
    const onSave = vi.fn(() => true)
    render(<SaveButton onSave={onSave} disabled />)
    fireEvent.click(button())
    expect(onSave).not.toHaveBeenCalled()
  })
})
