// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARKDOWN_DRAFT_KEY } from '@/lib/tools/markdown-preview'
import { MarkdownPreview } from './markdown-preview'
import { AUTOSAVE_DELAY_MS } from './use-auto-save'

vi.mock('./mermaid-diagram', () => ({
  MermaidDiagram: ({ code }: { code: string }) => <div>{code}</div>,
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const input = () => screen.getByLabelText('Markdown') as HTMLTextAreaElement
const preview = () => screen.getByRole('region', { name: 'プレビュー' })

describe('MarkdownPreview', () => {
  it('入力と同時にプレビューを更新する', async () => {
    render(<MarkdownPreview />)
    fireEvent.change(input(), { target: { value: '# タイトル' } })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'タイトル' }),
    ).toBeTruthy()
  })

  it('初期表示は並べて表示で、入力欄とプレビューの両方がある', () => {
    render(<MarkdownPreview />)
    expect(
      screen
        .getByRole('radio', { name: '並べて表示' })
        .getAttribute('aria-checked'),
    ).toBe('true')
    expect(input()).toBeTruthy()
    expect(preview()).toBeTruthy()
  })

  it('プレビューのみ・入力のみに切り替えられ、入力は残る', async () => {
    const user = userEvent.setup()
    render(<MarkdownPreview />)
    fireEvent.change(input(), { target: { value: '**残る**' } })

    await user.click(screen.getByRole('radio', { name: 'プレビューのみ' }))
    expect(screen.queryByLabelText('Markdown')).toBeNull()
    expect(preview().textContent).toContain('残る')

    await user.click(screen.getByRole('radio', { name: '入力のみ' }))
    expect(screen.queryByRole('region', { name: 'プレビュー' })).toBeNull()
    expect(input().value).toBe('**残る**')

    await user.click(screen.getByRole('radio', { name: '並べて表示' }))
    expect(input().value).toBe('**残る**')
    expect(preview()).toBeTruthy()
  })

  it('どの表示でも、表示の切り替えを使え、保存ボタンはない', async () => {
    const user = userEvent.setup()
    render(<MarkdownPreview />)
    for (const name of ['入力のみ', 'プレビューのみ', '並べて表示']) {
      await user.click(screen.getByRole('radio', { name }))
      expect(screen.queryByRole('button', { name: '保存' })).toBeNull()
      expect(screen.getByRole('radiogroup', { name: '表示' })).toBeTruthy()
    }
  })

  describe('ダウンロード', () => {
    const downloadButton = () =>
      screen.getByRole('button', { name: 'Markdown をダウンロード' })

    // jsdom には createObjectURL がなく、<a> の click で保存もされないので、作った Blob とリンクを記録する
    function stubDownload() {
      const blobs: Blob[] = []
      const createObjectURL = vi.fn((blob: Blob) => {
        blobs.push(blob)
        return 'blob:test'
      })
      const revokeObjectURL = vi.fn()
      // jsdom の URL には両方ともないので、テストの間だけ足す（afterEach で消す）
      Object.assign(URL, { createObjectURL, revokeObjectURL })
      const links: HTMLAnchorElement[] = []
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        function (this: HTMLAnchorElement) {
          links.push(this)
        },
      )
      return { blobs, links, revokeObjectURL }
    }

    afterEach(() => {
      vi.unstubAllGlobals()
      const url: Partial<
        Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>
      > = URL
      delete url.createObjectURL
      delete url.revokeObjectURL
    })

    it('押すと入力をそのまま .md ファイルとして、送信せずにダウンロードする', async () => {
      const { blobs, links, revokeObjectURL } = stubDownload()
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)
      const user = userEvent.setup()
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: '# メモ\n\n本文' } })

      await user.click(downloadButton())

      expect(links).toHaveLength(1)
      expect(links[0].download).toBe('メモ.md')
      expect(links[0].getAttribute('href')).toBe('blob:test')
      expect(blobs[0].type).toBe('text/markdown;charset=utf-8')
      expect(await blobs[0].text()).toBe('# メモ\n\n本文')
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('見出しがなければ markdown.md にする', async () => {
      const { links } = stubDownload()
      const user = userEvent.setup()
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: '本文だけ' } })
      await user.click(downloadButton())
      expect(links[0].download).toBe('markdown.md')
    })

    it.each([
      ['空', ''],
      ['空白と改行だけ', '  \n\t\n'],
    ])('入力が%sのときは押せない', (_, value) => {
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value } })
      expect((downloadButton() as HTMLButtonElement).disabled).toBe(true)
    })

    it('どの表示でも、ボタンがちょうど1つある', async () => {
      const user = userEvent.setup()
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: 'a' } })
      for (const name of ['入力のみ', 'プレビューのみ', '並べて表示']) {
        await user.click(screen.getByRole('radio', { name }))
        const buttons = screen.getAllByRole('button', {
          name: 'Markdown をダウンロード',
        })
        expect(buttons).toHaveLength(1)
        expect(buttons[0].getAttribute('title')).toBe('Markdown をダウンロード')
        // コピーボタンと同じ枠ありの見た目
        expect(buttons[0].className).toMatch(/\bborder\b/)
      }
    })

    it('Tab で移動して Enter でダウンロードできる', async () => {
      const { links } = stubDownload()
      const user = userEvent.setup()
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: '# キー' } })
      input().focus()
      // 並べて表示では、入力欄の見出しの行のボタンは入力欄より前にあるので Shift+Tab で戻る
      await user.tab({ shift: true })
      expect(document.activeElement).toBe(downloadButton())
      await user.keyboard('{Enter}')
      expect(links[0].download).toBe('キー.md')
    })
  })

  describe('自動保存', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const saved = () => {
      const raw = localStorage.getItem(MARKDOWN_DRAFT_KEY)
      return raw === null ? null : JSON.parse(raw)
    }

    it('入力して待つと保存され、作り直すと復元される', () => {
      const { unmount } = render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: '# 自動で保存' } })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
      expect(saved()).toBe('# 自動で保存')

      unmount()
      render(<MarkdownPreview />)
      expect(input().value).toBe('# 自動で保存')
    })

    it('入力しただけで待たなければ、まだ保存しない', () => {
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: 'a' } })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1))
      expect(saved()).toBeNull()
    })

    it('保存できないときは文言を読み上げ用の領域に出し、そのまま使える。後で保存できたら消す', () => {
      const setItem = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('denied')
        })
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: '**続ける**' } })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
      const message = screen.getByText(
        '自動保存できません。再読み込みすると入力が消えます。',
      )
      expect(message.getAttribute('aria-live')).toBe('polite')
      expect(message.className).not.toContain('sr-only')
      expect(preview().textContent).toContain('続ける')

      setItem.mockRestore()
      fireEvent.change(input(), { target: { value: '**続ける**!' } })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
      expect(
        screen.queryByText(
          '自動保存できません。再読み込みすると入力が消えます。',
        ),
      ).toBeNull()
      expect(saved()).toBe('**続ける**!')
    })
  })
})
