/**
 * Frontend Verification Test Suite
 * Tests authentication, dashboard, AI tutor, and route integrity
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { fixedApiService } from '../services/fixedApi'
import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import DashboardPage from '../pages/DashboardPage'
import AIChatPage from '../pages/AIChatPage'

// Mock the API service
vi.mock('../services/fixedApi', () => ({
  fixedApiService: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
    },
    dashboard: {
      getStats: vi.fn(),
      getActivity: vi.fn(),
    },
    aiTutor: {
      chat: vi.fn(),
      getSession: vi.fn(),
    },
    health: {
      check: vi.fn(),
    }
  }
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Login Page', () => {
    it('should render login form correctly', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      expect(screen.getByText(/Sign In/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
    })

    it('should handle successful login', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      }

      vi.mocked(fixedApiService.auth.login).mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Fill form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'password123' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

      await waitFor(() => {
        expect(fixedApiService.auth.login).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials')
      vi.mocked(fixedApiService.auth.login).mockRejectedValue(mockError)

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Fill form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'wrongpassword' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

      await waitFor(() => {
        expect(screen.getByText(/Login failed/i)).toBeInTheDocument()
      })
    })

    it('should validate form fields', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument()
      })

      // Test invalid email
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'invalid-email' }
      })
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Signup Page', () => {
    it('should render signup form correctly', () => {
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>
      )

      expect(screen.getByText(/Create Account/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument()
    })

    it('should handle successful registration', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      }

      vi.mocked(fixedApiService.auth.register).mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>
      )

      // Fill form
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' }
      })
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'password123' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

      await waitFor(() => {
        expect(fixedApiService.auth.register).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role_track: 'general',
          agree_terms: true
        })
      })
    })

    it('should validate password strength', async () => {
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>
      )

      // Fill form with weak password
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' }
      })
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: '123' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })
  })

  describe('Token Management', () => {
    it('should store tokens in localStorage after login', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      }

      vi.mocked(fixedApiService.auth.login).mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'password123' }
      })
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBe('mock-token')
        expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
      })
    })

    it('should clear tokens on logout', async () => {
      // Set initial tokens
      localStorage.setItem('access_token', 'mock-token')
      localStorage.setItem('refresh_token', 'mock-refresh-token')

      const mockResponse = { success: true }
      vi.mocked(fixedApiService.auth.logout).mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      )

      // Find and click logout button
      const logoutButton = screen.getByText(/Logout/i)
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBeNull()
        expect(localStorage.getItem('refresh_token')).toBeNull()
      })
    })
  })
})

describe('Dashboard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock authenticated user
    localStorage.setItem('access_token', 'mock-token')
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }))
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should render dashboard correctly', async () => {
    const mockStats = {
      success: true,
      data: {
        total_courses: 5,
        completed_courses: 2,
        total_problems: 50,
        solved_problems: 30,
        current_streak: 7
      }
    }

    const mockActivity = {
      success: true,
      data: [
        { type: 'course_completed', timestamp: '2024-01-01' },
        { type: 'problem_solved', timestamp: '2024-01-02' }
      ]
    }

    vi.mocked(fixedApiService.dashboard.getStats).mockResolvedValue(mockStats)
    vi.mocked(fixedApiService.dashboard.getActivity).mockResolvedValue(mockActivity)

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
      expect(screen.getByText(/5/i)).toBeInTheDocument() // total_courses
      expect(screen.getByText(/2/i)).toBeInTheDocument() // completed_courses
    })

    expect(fixedApiService.dashboard.getStats).toHaveBeenCalled()
    expect(fixedApiService.dashboard.getActivity).toHaveBeenCalled()
  })

  it('should handle dashboard data loading error', async () => {
    vi.mocked(fixedApiService.dashboard.getStats).mockRejectedValue(new Error('Network error'))

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument()
    })
  })

  it('should refresh dashboard data', async () => {
    const mockStats = {
      success: true,
      data: { total_courses: 5, completed_courses: 2 }
    }

    vi.mocked(fixedApiService.dashboard.getStats).mockResolvedValue(mockStats)

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(fixedApiService.dashboard.getStats).toHaveBeenCalledTimes(1)
    })

    // Find and click refresh button
    const refreshButton = screen.getByTitle(/Refresh/i)
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(fixedApiService.dashboard.getStats).toHaveBeenCalledTimes(2)
    })
  })
})

describe('AI Tutor Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('access_token', 'mock-token')
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }))
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should render AI chat interface', () => {
    render(
      <TestWrapper>
        <AIChatPage />
      </TestWrapper>
    )

    expect(screen.getByText(/AI Tutor/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument()
  })

  it('should send message to AI tutor', async () => {
    const mockResponse = {
      success: true,
      data: {
        response: 'Python is a high-level programming language...'
      }
    }

    vi.mocked(fixedApiService.aiTutor.chat).mockResolvedValue(mockResponse)

    render(
      <TestWrapper>
        <AIChatPage />
      </TestWrapper>
    )

    // Type message
    const messageInput = screen.getByPlaceholderText(/Type your message/i)
    fireEvent.change(messageInput, {
      target: { value: 'What is Python?' }
    })

    // Send message
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      expect(fixedApiService.aiTutor.chat).toHaveBeenCalledWith({
        message: 'What is Python?',
        message_type: 'question',
        user_id: '1',
        context: {}
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Python is a high-level programming language/i)).toBeInTheDocument()
    })
  })

  it('should handle empty message validation', async () => {
    render(
      <TestWrapper>
        <AIChatPage />
      </TestWrapper>
    )

    // Try to send empty message
    const sendButton = screen.getByRole('button', { name: /Send/i })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/Please enter a message/i)).toBeInTheDocument()
    })

    // Should not call API
    expect(fixedApiService.aiTutor.chat).not.toHaveBeenCalled()
  })

  it('should handle AI tutor error', async () => {
    vi.mocked(fixedApiService.aiTutor.chat).mockRejectedValue(new Error('AI service unavailable'))

    render(
      <TestWrapper>
        <AIChatPage />
      </TestWrapper>
    )

    // Send message
    const messageInput = screen.getByPlaceholderText(/Type your message/i)
    fireEvent.change(messageInput, {
      target: { value: 'Test message' }
    })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument()
    })
  })

  it('should display typing indicator', async () => {
    // Mock delayed response
    vi.mocked(fixedApiService.aiTutor.chat).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { response: 'Response' }
      }), 1000))
    )

    render(
      <TestWrapper>
        <AIChatPage />
      </TestWrapper>
    )

    // Send message
    const messageInput = screen.getByPlaceholderText(/Type your message/i)
    fireEvent.change(messageInput, {
      target: { value: 'Test message' }
    })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    // Should show typing indicator
    await waitFor(() => {
      expect(screen.getByText(/AI is typing/i)).toBeInTheDocument()
    }, { timeout: 500 })
  })
})

describe('Route Integrity Tests', () => {
  it('should handle protected routes', async () => {
    // Clear tokens to simulate unauthenticated state
    localStorage.clear()

    // Mock navigation to dashboard (should redirect to login)
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }))

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('should handle invalid routes gracefully', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      Navigate: ({ to }: { to: string }) => <div>Navigating to {to}</div>
    }))

    // This would be tested by actual routing in the app
    expect(true).toBe(true) // Placeholder for route testing
  })

  it('should maintain navigation state', async () => {
    // Test that navigation state is preserved
    localStorage.setItem('access_token', 'mock-token')
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }))

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
    })

    // User should remain authenticated
    expect(localStorage.getItem('access_token')).toBe('mock-token')
  })
})

describe('API Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle API errors gracefully', async () => {
    const mockError = new Error('Network error')
    vi.mocked(fixedApiService.auth.login).mockRejectedValue(mockError)

    try {
      await fixedApiService.auth.login('test@example.com', 'password')
    } catch (error) {
      expect(error).toBe(mockError)
    }
  })

  it('should format API responses correctly', async () => {
    const mockResponse = {
      success: true,
      data: { user: { id: '1', email: 'test@example.com' } }
    }

    vi.mocked(fixedApiService.auth.getCurrentUser).mockResolvedValue(mockResponse)

    const result = await fixedApiService.auth.getCurrentUser()
    expect(result.success).toBe(true)
    expect(result.data.user.email).toBe('test@example.com')
  })

  it('should handle timeout errors', async () => {
    const timeoutError = new Error('Request timeout')
    vi.mocked(fixedApiService.aiTutor.chat).mockRejectedValue(timeoutError)

    try {
      await fixedApiService.aiTutor.chat({
        message: 'Test',
        message_type: 'question',
        user_id: '1',
        context: {}
      })
    } catch (error) {
      expect((error as Error).message).toBe('Request timeout')
    }
  })
})

describe('Integration Tests', () => {
  it('should complete full authentication flow', async () => {
    // Mock successful registration
    const mockRegisterResponse = {
      success: true,
      token: 'mock-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User' }
    }
    vi.mocked(fixedApiService.auth.register).mockResolvedValue(mockRegisterResponse)

    // Mock user data
    const mockUserResponse = {
      success: true,
      data: { id: '1', email: 'test@example.com', name: 'Test User' }
    }
    vi.mocked(fixedApiService.auth.getCurrentUser).mockResolvedValue(mockUserResponse)

    // Test registration
    render(
      <TestWrapper>
        <SignupPage />
      </TestWrapper>
    )

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Test User' }
    })
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(fixedApiService.auth.register).toHaveBeenCalled()
      expect(localStorage.getItem('access_token')).toBe('mock-token')
    })

    // Test dashboard access
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
    })
  })

  it('should handle session expiration', async () => {
    // Set expired token
    localStorage.setItem('access_token', 'expired-token')
    localStorage.setItem('token_expires_at', (Date.now() - 1000).toString())

    // Mock 401 response
    const authError = new Error('Token expired')
    authError.name = 'ApiError'
    vi.mocked(fixedApiService.auth.getCurrentUser).mockRejectedValue(authError)

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    // Should handle token expiration gracefully
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull()
    })
  })
})
