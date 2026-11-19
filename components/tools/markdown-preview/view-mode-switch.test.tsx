// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { ViewMode } from './view-mode-switch'
import { ViewModeSwitch } from './view-mode-switch'

function Harness() {
  const [mode, setMode] = useState<ViewMode>('split')
  return <ViewModeSwitch value={mode} onChange={setMode} />
}

const checked = () =>
  screen
    .getAllByRole('radio')
    .filter((radio) => radio.getAttribute('aria-checked') === 'true')
    .map((radio) => radio.textContent)

describe('ViewModeSwitch', () => {
  it('3つの表示が radio として並び、選択中が分かる', () => {
    render(<Harness />)
    expect(screen.getByRole('radiogroup', { name: '表示' })).toBeTruthy()
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([
      '並べて表示',
      '入力のみ',
      'プレビューのみ',
    ])
    expect(checked()).toEqual(['並べて表示'])
  })

  it('クリックで選べる', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('radio', { name: 'プレビューのみ' }))
    expect(checked()).toEqual(['プレビューのみ'])
  })

  it('キーボード（Tab と Enter / Space）で選べる', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()
    await user.tab()
    expect(document.activeElement?.textContent).toBe('入力のみ')
    await user.keyboard('{Enter}')
    expect(checked()).toEqual(['入力のみ'])
    await user.tab()
    await user.keyboard(' ')
    expect(checked()).toEqual(['プレビューのみ'])
  })
})
