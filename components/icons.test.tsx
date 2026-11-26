// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DownloadIcon, PlusIcon, TrashIcon } from './icons'

describe('アイコン', () => {
  it.each([
    ['plus', PlusIcon],
    ['trash', TrashIcon],
    ['download', DownloadIcon],
  ])('%s は読み上げられない', (name, Component) => {
    const { container } = render(<Component />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.dataset.icon).toBe(name)
  })
})
