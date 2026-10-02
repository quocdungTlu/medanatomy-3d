import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'

let ready = false

/** Khởi tạo PostHog nếu có key; không có key thì chỉ log ra console khi dev. */
export function initAnalytics() {
  if (ready || !key) return
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    persistence: 'localStorage+cookie',
    autocapture: false,
  })
  ready = true
}

export function track(event: string, props?: Record<string, unknown>) {
  if (ready) posthog.capture(event, props)
  else if (import.meta.env.DEV) console.debug('[analytics]', event, props ?? '')
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (ready) posthog.identify(userId, props)
}
