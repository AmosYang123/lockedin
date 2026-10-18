import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Logo } from './ui'

describe('Logo', () => {
  it('renders a decorative, scalable brand mark', () => {
    const markup = renderToStaticMarkup(<Logo size={40} />)

    expect(markup).toContain('width="40"')
    expect(markup).toContain('height="40"')
    expect(markup).toContain('viewBox="0 0 32 32"')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('#c8523b')
    expect(markup).toContain('#f5f0e8')
  })
})
