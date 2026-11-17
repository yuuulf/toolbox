// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ToolCard } from './tool-card'

describe('ToolCard', () => {
  it('名前と説明を表示し、ツールのページへリンクする', () => {
    render(
      <ToolCard
        slug="char-counter"
        name="文字数カウント"
        description="文字数を数えます。"
      />,
    )

    const link = screen.getByRole('link', { name: /文字数カウント/ })
    expect(link).toHaveAttribute('href', '/tools/char-counter')
    expect(
      screen.getByRole('heading', { name: '文字数カウント' }),
    ).toBeInTheDocument()
    expect(screen.getByText('文字数を数えます。')).toBeInTheDocument()
  })
})
