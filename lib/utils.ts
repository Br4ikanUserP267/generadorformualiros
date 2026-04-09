import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ApiFetchOptions = RequestInit & {
  redirectOn401?: boolean
}

export async function apiFetch(input: RequestInfo | URL, options: ApiFetchOptions = {}) {
  const { redirectOn401 = true, ...init } = options
  const url = typeof input === 'string' ? input : input.toString()

  // When basePath is set, Next.js automatically handles routing
  // Just pass the URL as-is; the browser context already respects basePath
  console.log('[apiFetch] Starting fetch:', { url, redirectOn401 })
  try {
    const response = await fetch(input, {
      credentials: 'include',
      ...init,
    })
    console.log('[apiFetch] Got response:', { url, status: response.status })

    if (redirectOn401 && response.status === 401 && typeof window !== 'undefined') {
      console.log('[apiFetch] 401 Unauthorized, redirecting to /')
      window.location.href = '/'
    }

    return response
  } catch (err) {
    console.error('[apiFetch] Fetch failed:', { url, error: err })
    throw err
  }
}
