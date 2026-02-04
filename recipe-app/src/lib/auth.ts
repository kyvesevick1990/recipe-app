import { supabase } from './supabase'

const AUTH_COOKIE_NAME = 'recipe_app_authenticated'

export async function verifyPassword(password: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'app_password')
    .single()

  if (error || !data) {
    console.error('Error fetching password:', error)
    return false
  }

  return data.value === password
}

export function setAuthCookie(): void {
  // Set cookie that expires in 7 days
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)
  document.cookie = `${AUTH_COOKIE_NAME}=true; expires=${expires.toUTCString()}; path=/; SameSite=Strict`
}

export function checkAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.includes(`${AUTH_COOKIE_NAME}=true`)
}

export function clearAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
