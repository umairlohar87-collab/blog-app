/** Where to go after auth: the page that sent the user to login, else the dashboard. */
export function redirectTarget(location) {
  const from = location.state?.from
  if (!from?.pathname || from.pathname === '/login' || from.pathname === '/register') return '/dashboard'
  return `${from.pathname}${from.search || ''}`
}
