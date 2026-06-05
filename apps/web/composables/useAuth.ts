export const useAuth = () => {
  const user = useState('auth-user', () => null)
  const token = useCookie('auth-token')
  const api = useApi()

  const login = async (email: string, password: string) => {
    const data = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    token.value = data.token
    user.value = data.user
    return data
  }

  const register = async (username: string, email: string, password: string) => {
    const data = await api('/api/v1/auth/register', {
      method: 'POST',
      body: { username, email, password },
    })
    token.value = data.token
    user.value = data.user
    return data
  }

  const logout = () => {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  const fetchProfile = async () => {
    if (!token.value) return null
    try {
      const data = await api('/api/v1/auth/profile')
      user.value = data
      return data
    } catch {
      token.value = null
      user.value = null
      return null
    }
  }

  return { user, token, login, register, logout, fetchProfile }
}
