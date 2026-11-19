// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTOSAVE_DELAY_MS, useAutoSave } from './use-auto-save'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

type Props = { value: string; ready: boolean }

function setup(
  save = vi.fn(() => true),
  initial: Props = { value: '', ready: true },
) {
  const hook = renderHook(
    ({ value, ready }: Props) => useAutoSave(value, ready, save),
    {
      initialProps: initial,
    },
  )
  return { save, ...hook }
}

function setVisibility(state: DocumentVisibilityState) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useAutoSave', () => {
  it('値が変わってから約0.5秒後に1回だけ保存する', () => {
    const { save, rerender } = setup()
    rerender({ value: 'a', ready: true })
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1))
    expect(save).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('a')
  })

  it('続けて変わったら、止まってから最後の値だけを保存する', () => {
    const { save, rerender } = setup()
    for (const value of ['a', 'ab', 'abc']) {
      rerender({ value, ready: true })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 100))
    }
    expect(save).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(100))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('abc')
  })

  it('開いただけ（読み込んだ値のまま）では保存しない', () => {
    const { save, unmount } = setup(undefined, {
      value: '保存済み',
      ready: true,
    })
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2))
    unmount()
    expect(save).not.toHaveBeenCalled()
  })

  it('読み込む前（ready が false）は保存しない', () => {
    const { save, rerender, unmount } = setup(undefined, {
      value: '',
      ready: false,
    })
    rerender({ value: 'a', ready: false })
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2))
    unmount()
    expect(save).not.toHaveBeenCalled()
  })

  it('保存した値に戻したときは保存しない', () => {
    const { save, rerender } = setup()
    rerender({ value: 'a', ready: true })
    rerender({ value: '', ready: true })
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2))
    expect(save).not.toHaveBeenCalled()
  })

  it('待ち時間の途中で pagehide が起きたら、すぐに保存する', () => {
    const { save, rerender } = setup()
    rerender({ value: 'a', ready: true })
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    expect(save).toHaveBeenCalledWith('a')
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2))
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('待ち時間の途中で非表示になったら、すぐに保存する', () => {
    const { save, rerender } = setup()
    rerender({ value: 'a', ready: true })
    act(() => setVisibility('visible'))
    expect(save).not.toHaveBeenCalled()
    act(() => setVisibility('hidden'))
    expect(save).toHaveBeenCalledWith('a')
  })

  it('待ち時間の途中でアンマウントされたら、すぐに保存する', () => {
    const { save, rerender, unmount } = setup()
    rerender({ value: 'a', ready: true })
    unmount()
    expect(save).toHaveBeenCalledWith('a')
  })

  it('未保存の値がなければ、ページを離れても保存しない', () => {
    const { save, rerender, unmount } = setup()
    rerender({ value: 'a', ready: true })
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    unmount()
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('保存に失敗したら true を返し、次に成功したら false に戻る', () => {
    const save = vi.fn(() => false)
    const { result, rerender } = setup(save)
    expect(result.current).toBe(false)
    rerender({ value: 'a', ready: true })
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
    expect(result.current).toBe(true)

    save.mockReturnValue(true)
    rerender({ value: 'ab', ready: true })
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
    expect(result.current).toBe(false)
  })
})
