import { createClient } from '@supabase/supabase-js'

describe('Supabase Client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should create client with environment variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    expect(client).toBeDefined()
  })

  it('should throw error when URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    expect(() => {
      createClient('', 'test-key')
    }).toThrow()
  })

  it('should throw error when anon key is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => {
      createClient('https://test.supabase.co', '')
    }).toThrow()
  })
})
