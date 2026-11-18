// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_LINES } from '@/lib/tools/text-diff'
import { TextDiff } from './text-diff'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TextDiff', () => {
  it('初期表示では入力を促し、比較結果は出さない', () => {
    render(<TextDiff />)
    expect(
      screen.getByText('比較するテキストを入力してください。'),
    ).toBeTruthy()
    expect(screen.queryByRole('region', { name: '比較結果' })).toBeNull()
  })

  it('入力するとボタンを押さずに比較結果が表示される', async () => {
    const user = userEvent.setup()
    render(<TextDiff />)
    await user.type(screen.getByLabelText('変更前'), 'a{Enter}b')
    await user.type(screen.getByLabelText('変更後'), 'a{Enter}c')

    const region = await screen.findByRole('region', { name: '比較結果' })
    expect(region.textContent).toContain('削除')
    expect(region.textContent).toContain('追加')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('同じテキストなら「差分はありません。」と表示し、比較結果は出さない', async () => {
    render(<TextDiff />)
    fireEvent.change(screen.getByLabelText('変更前'), {
      target: { value: 'a\nb' },
    })
    fireEvent.change(screen.getByLabelText('変更後'), {
      target: { value: 'a\nb' },
    })
    expect(await screen.findByText('差分はありません。')).toBeTruthy()
    expect(screen.queryByRole('region', { name: '比較結果' })).toBeNull()
  })

  it('行数の上限を超えると案内を出し、比較結果は出さない', async () => {
    render(<TextDiff />)
    fireEvent.change(screen.getByLabelText('変更前'), {
      target: {
        value: Array.from({ length: MAX_LINES + 1 }, () => 'x').join('\n'),
      },
    })
    expect(
      await screen.findByText('比較できるのは 5,000 行までです。'),
    ).toBeTruthy()
    expect(screen.queryByRole('region', { name: '比較結果' })).toBeNull()
  })

  it('結果欄は読み上げ用の文言がはみ出さないよう、位置の基準になる', async () => {
    render(<TextDiff />)
    fireEvent.change(screen.getByLabelText('変更前'), {
      target: { value: 'a' },
    })
    fireEvent.change(screen.getByLabelText('変更後'), {
      target: { value: 'b' },
    })
    const region = await screen.findByRole('region', { name: '比較結果' })
    expect(region.className.split(' ')).toEqual(
      expect.arrayContaining(['relative', 'max-h-64', 'overflow-y-auto']),
    )
  })

  it('案内は読み上げ領域に出す', () => {
    render(<TextDiff />)
    const message = screen.getByText('比較するテキストを入力してください。')
    expect(message.getAttribute('aria-live')).toBe('polite')
  })

  it('入力したテキストを保存しない', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    render(<TextDiff />)
    await user.type(screen.getByLabelText('変更前'), 'abc')
    await user.type(screen.getByLabelText('変更後'), 'abd')
    expect(setItem).not.toHaveBeenCalled()
  })
})
