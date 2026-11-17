import {
  getRewrittenUrl,
  isRewrite,
  unstable_doesMiddlewareMatch,
} from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { config, proxy } from './proxy'

const BASE = 'http://localhost'

describe('proxy', () => {
  it('/tools/<slug> だけで動く', () => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: '/tools/json-formatter' }),
    ).toBe(true)
    expect(unstable_doesMiddlewareMatch({ config, url: '/' })).toBe(false)
    expect(unstable_doesMiddlewareMatch({ config, url: '/nope' })).toBe(false)
  })

  it('登録済みの slug は書き換えずにそのまま通す', () => {
    const response = proxy(new NextRequest(`${BASE}/tools/json-formatter`))
    expect(isRewrite(response)).toBe(false)
  })

  it('未登録の slug は 404 になるパスへ書き換える', () => {
    const response = proxy(new NextRequest(`${BASE}/tools/does-not-exist`))
    expect(isRewrite(response)).toBe(true)
    expect(getRewrittenUrl(response)).toBe(`${BASE}/__not-found`)
  })
})
