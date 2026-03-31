// Auth utility functions moved to fix fast refresh issue

export const fetchUserWithToken = async (token) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile')
    }
    
    const user = await response.json()
    return user
  } catch (error) {
    console.error('Fetch user error:', error)
    throw new Error('Failed to fetch user profile')
  }
}

export const registerUser = async (userData) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      return { success: true, user: result.user, token: result.access_token }
    } else {
      return { success: false, error: result.detail || 'Registration failed' }
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

export const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `username=${email}&password=${password}`
    })
    
    const result = await response.json()
    
    if (response.ok) {
      return { success: true, user: result.user, token: result.access_token }
    } else {
      return { success: false, error: result.detail || 'Login failed' }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

export const loginWithOAuth = async (provider, userData) => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/auth/${provider}/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      return { success: true, user: result.user, token: result.access_token }
    } else {
      return { success: false, error: result.detail || 'OAuth login failed' }
    }
  } catch (error) {
    console.error('OAuth login error:', error)
    return { success: false, error: 'OAuth login failed' }
  }
}
