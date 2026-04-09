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

  // When basePath is configured in next.config, fetch() calls don't automatically prefix it
  // We need to manually add the basePath for all API routes
  let url: string
  if (input instanceof URL) {
    url = input.href
  } else {
    url = input as string
  }

  // Add basePath prefix if this is a relative API path
  if (typeof window !== 'undefined' && url.startsWith('/api') && !url.startsWith('/matriz-riesgos')) {
    // Use the public base path constant
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/matriz-riesgos'
    url = `${basePath}${url}`
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  })

  if (redirectOn401 && response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/'
  }

  return response
}
