export interface User {
  id: number
  email: string
  name: string | null
  picture: string | null
  createdAt: string
}

export interface AuthResponse {
  message: string
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}





