import {
  searchSchema,
  loginSchema,
  registerSchema,
  apiKeySchema,
  reportSchema,
  sanitizeInput,
  validateSearchQuery,
} from '@/lib/utils/validation'

describe('Validation Schemas', () => {
  describe('searchSchema', () => {
    it('should validate valid search parameters', () => {
      const validParams = {
        q: 'medical device',
        market: 'fda',
        page: 1,
        limit: 20,
      }
      const result = searchSchema.safeParse(validParams)
      expect(result.success).toBe(true)
    })

    it('should accept default values for optional params', () => {
      const minimalParams = {
        q: 'test',
      }
      const result = searchSchema.safeParse(minimalParams)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.market).toBe('all')
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should reject empty query', () => {
      const invalidParams = {
        q: '',
      }
      const result = searchSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should reject query exceeding maximum length', () => {
      const invalidParams = {
        q: 'a'.repeat(201),
      }
      const result = searchSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should reject invalid market value', () => {
      const invalidParams = {
        q: 'test',
        market: 'invalid',
      }
      const result = searchSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should reject negative page number', () => {
      const invalidParams = {
        q: 'test',
        page: -1,
      }
      const result = searchSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })

    it('should reject limit exceeding maximum', () => {
      const invalidParams = {
        q: 'test',
        limit: 101,
      }
      const result = searchSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'password123',
      }
      const result = loginSchema.safeParse(validLogin)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'password123',
      }
      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidLogin = {
        email: 'user@example.com',
        password: '12345',
      }
      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const invalidLogin = {
        email: '',
        password: 'password123',
      }
      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validRegister = {
        name: 'John Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }
      const result = registerSchema.safeParse(validRegister)
      expect(result.success).toBe(true)
    })

    it('should reject when passwords do not match', () => {
      const invalidRegister = {
        name: 'John Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      }
      const result = registerSchema.safeParse(invalidRegister)
      expect(result.success).toBe(false)
    })

    it('should reject short name', () => {
      const invalidRegister = {
        name: 'A',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }
      const result = registerSchema.safeParse(invalidRegister)
      expect(result.success).toBe(false)
    })

    it('should reject name exceeding maximum length', () => {
      const invalidRegister = {
        name: 'a'.repeat(51),
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }
      const result = registerSchema.safeParse(invalidRegister)
      expect(result.success).toBe(false)
    })

    it('should reject weak password', () => {
      const invalidRegister = {
        name: 'John Doe',
        email: 'user@example.com',
        password: '123',
        confirmPassword: '123',
      }
      const result = registerSchema.safeParse(invalidRegister)
      expect(result.success).toBe(false)
    })
  })

  describe('apiKeySchema', () => {
    it('should validate valid API key data', () => {
      const validKey = {
        name: 'Production API Key',
        description: 'For production use',
      }
      const result = apiKeySchema.safeParse(validKey)
      expect(result.success).toBe(true)
    })

    it('should validate without description', () => {
      const validKey = {
        name: 'Test Key',
      }
      const result = apiKeySchema.safeParse(validKey)
      expect(result.success).toBe(true)
    })

    it('should reject empty API key name', () => {
      const invalidKey = {
        name: '',
      }
      const result = apiKeySchema.safeParse(invalidKey)
      expect(result.success).toBe(false)
    })

    it('should reject API key name exceeding maximum length', () => {
      const invalidKey = {
        name: 'a'.repeat(101),
      }
      const result = apiKeySchema.safeParse(invalidKey)
      expect(result.success).toBe(false)
    })

    it('should reject description exceeding maximum length', () => {
      const invalidKey = {
        name: 'Test Key',
        description: 'a'.repeat(501),
      }
      const result = apiKeySchema.safeParse(invalidKey)
      expect(result.success).toBe(false)
    })
  })

  describe('reportSchema', () => {
    it('should validate valid report request', () => {
      const validRequest = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        reportType: 'market_analysis',
        language: 'zh',
      }
      const result = reportSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should accept default language', () => {
      const validRequest = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        reportType: 'competitor_analysis',
      }
      const result = reportSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.language).toBe('zh')
      }
    })

    it('should reject invalid company ID format', () => {
      const invalidRequest = {
        companyId: 'invalid-uuid',
        reportType: 'market_analysis',
      }
      const result = reportSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject invalid report type', () => {
      const invalidRequest = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        reportType: 'invalid_type',
      }
      const result = reportSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject invalid language', () => {
      const invalidRequest = {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        reportType: 'market_analysis',
        language: 'fr',
      }
      const result = reportSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })
})

describe('Utility Functions', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>'
      const result = sanitizeInput(input)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")'
      const result = sanitizeInput(input)
      expect(result).not.toContain('javascript:')
    })

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")'
      const result = sanitizeInput(input)
      expect(result).not.toContain('onclick=')
    })

    it('should trim whitespace', () => {
      const input = '  test input  '
      const result = sanitizeInput(input)
      expect(result).toBe('test input')
    })

    it('should handle normal text', () => {
      const input = 'Normal text with spaces'
      const result = sanitizeInput(input)
      expect(result).toBe('Normal text with spaces')
    })
  })

  describe('validateSearchQuery', () => {
    it('should return sanitized query for valid input', () => {
      const query = '  medical device  '
      const result = validateSearchQuery(query)
      expect(result).toBe('medical device')
    })

    it('should return null for empty query', () => {
      const query = ''
      const result = validateSearchQuery(query)
      expect(result).toBeNull()
    })

    it('should return null for whitespace-only query', () => {
      const query = '   '
      const result = validateSearchQuery(query)
      expect(result).toBeNull()
    })

    it('should return null for query exceeding maximum length', () => {
      const query = 'a'.repeat(201)
      const result = validateSearchQuery(query)
      expect(result).toBeNull()
    })

    it('should sanitize malicious input', () => {
      const query = '<script>alert("xss")</script>'
      const result = validateSearchQuery(query)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should accept query at maximum length', () => {
      const query = 'a'.repeat(200)
      const result = validateSearchQuery(query)
      expect(result).toBe(query)
    })
  })
})
