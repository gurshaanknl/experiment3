// These are the users used for this college experiment.
export const users = [
  { email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { email: 'editor@example.com', password: 'editor123', role: 'editor' },
  { email: 'viewer@example.com', password: 'viewer123', role: 'viewer' },
]

// Each role has a list of actions it is allowed to perform.
export const permissions = {
  admin: ['create', 'edit', 'delete', 'read'],
  editor: ['create', 'edit', 'read'],
  viewer: ['read'],
}

// This returns true when the role has the requested permission.
export function hasPermission(role, permission) {
  const rolePermissions = permissions[role]

  if (!rolePermissions) {
    return false
  }

  return rolePermissions.includes(permission)
}

// This creates a simple token that looks like a JWT.
export function createToken(user) {
  const header = btoa(JSON.stringify({ type: 'JWT', algorithm: 'none' }))
  const payload = btoa(
    JSON.stringify({
      user: { email: user.email },
      role: user.role,
      expiresAt: Date.now() + 15 * 1000,
    }),
  )

  // This is only a simulated signature. It is not secure.
  return `${header}.${payload}.simulated-signature`
}

// This reads the user information from the token payload.
export function readToken(token) {
  if (!token) {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

// This checks whether the token is missing, invalid, or expired.
export function isTokenExpired(token) {
  const tokenData = readToken(token)

  return !tokenData || !tokenData.user || Date.now() >= tokenData.expiresAt
}

// This creates and stores a new token when the old token has expired.
export function getValidToken() {
  const oldToken = localStorage.getItem('token')

  if (!oldToken) {
    return null
  }

  if (!isTokenExpired(oldToken)) {
    return oldToken
  }

  const oldTokenData = readToken(oldToken)
  if (!oldTokenData || !oldTokenData.user) {
    localStorage.removeItem('token')
    return null
  }

  const newToken = createToken({
    email: oldTokenData.user.email,
    role: oldTokenData.role,
  })

  localStorage.setItem('token', newToken)
  return newToken
}
