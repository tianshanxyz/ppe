import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { validateEnvironment, validateAndLog } from '@/lib/config/env-validator'

describe('Environment Variable Validator', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateEnvironment', () => {
    it('should return valid when all required env vars are set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

      const result = validateEnvironment()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid when required env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('NEXT_PUBLIC_SUPABASE_URL'))).toBe(true)
    })

    it('should return warning when env vars use example values', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'

      const result = validateEnvironment()

      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should validate URL format for SUPABASE_URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('NEXT_PUBLIC_SUPABASE_URL'))).toBe(true)
    })

    it('should include environment info', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
      process.env.NODE_ENV = 'test'

      const result = validateEnvironment()

      expect(result.info).toBeDefined()
    })

    it('should detect placeholder values', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

      const result = validateEnvironment()

      expect(result.warnings.some(w => w.includes('占位符') || w.includes('示例值'))).toBe(true)
    })
  })

  describe('validateAndLog', () => {
    it('should log errors when validation fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const result = validateAndLog()

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })

    it('should return true when validation passes', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

      const result = validateAndLog()

      expect(result).toBe(true)
      
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })
})
