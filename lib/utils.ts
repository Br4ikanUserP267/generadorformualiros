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

  const response = await fetch(input, {
    credentials: 'include',
    ...init,
  })

  if (redirectOn401 && response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/'
  }

  return response
}
