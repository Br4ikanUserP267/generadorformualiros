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
  
  // Automatically prefix API calls with the basePath if it's a relative path
  let url = input instanceof URL ? input.href : input as string
  if (url.startsWith('/') && !url.startsWith('/matriz-riesgos')) {
    url = `/matriz-riesgos${url}`
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  })

  if (redirectOn401 && response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/matriz-riesgos'
  }

  return response
}
