import { http } from 'msw'

export const handlers = [
  // Auth endpoints
  http.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-token',
        token_type: 'bearer',
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'Test User',
        },
      })
    )
  }),

  http.post('/api/v1/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'User created successfully',
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'Test User',
        },
      })
    )
  }),

  // User endpoints
  http.get('/api/v1/users/me', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      })
    )
  }),

  // Course endpoints
  http.get('/api/v1/courses', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        courses: [
          {
            id: '1',
            title: 'Python Basics',
            description: 'Learn Python from scratch',
            difficulty: 'beginner',
            duration: '4 weeks',
            lessons: 20,
          },
          {
            id: '2',
            title: 'Advanced Python',
            description: 'Master advanced Python concepts',
            difficulty: 'advanced',
            duration: '6 weeks',
            lessons: 30,
          },
        ],
      })
    )
  }),

  // Problem endpoints
  http.get('/api/v1/problems', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        problems: [
          {
            id: '1',
            title: 'Hello World',
            description: 'Print Hello World to console',
            difficulty: 'easy',
            language: 'python',
            points: 10,
          },
          {
            id: '2',
            title: 'Sum of Two Numbers',
            description: 'Calculate sum of two numbers',
            difficulty: 'easy',
            language: 'python',
            points: 15,
          },
        ],
      })
    )
  }),

  // Progress endpoints
  http.get('/api/v1/progress', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user_id: '1',
        courses_completed: 2,
        problems_solved: 15,
        total_points: 150,
        streak: 5,
        rank: 'intermediate',
      })
    )
  }),

  // AI endpoints
  http.post('/api/v1/advanced/ai/analyze-code', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        analysis: {
          quality: 'good',
          patterns: ['clean code', 'proper indentation'],
          architecture: 'well-structured',
        },
        suggestions: ['Consider adding error handling', 'Add comments for clarity'],
        score: 85.5,
        complexity: 'moderate',
        issues: [],
        execution_time: 0.5,
      })
    )
  }),

  http.post('/api/v1/advanced/ai/mentor', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        answer: 'To write a for loop in Python, you can use the following syntax: for item in iterable: print(item)',
        hints: ['Use range() for numeric loops', 'Remember to indent the loop body'],
        code_example: 'for i in range(5):\n    print(i)',
        difficulty: 'beginner',
        related_topics: ['loops', 'iteration', 'range function'],
      })
    )
  }),

  // Certificate endpoints
  http.post('/api/v1/advanced/certificates/issue', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        certificate_id: 'cert-123',
        user_id: '1',
        user_name: 'Test User',
        course_name: 'Python Basics',
        template_type: 'course_completion',
        issued_at: '2024-01-01T00:00:00Z',
        signature: 'mock-signature',
        qr_code: 'mock-qr-code',
        pdf_data: 'mock-pdf-data',
        status: 'issued',
      })
    )
  }),

  // Health check
  http.get('/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'ok',
        service: 'pymastery-api',
        timestamp: new Date().toISOString(),
      })
    )
  }),
]

export const server = {
  listen: (_options = {}) => {
    // Mock server implementation
    console.log('Mock server started')
  },
  resetHandlers: () => {
    // Reset handlers implementation
    console.log('Mock server handlers reset')
  },
  close: () => {
    // Close server implementation
    console.log('Mock server closed')
  },
}
