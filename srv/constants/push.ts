export const PUSH_LOCALE = 'pt';

export const PUSH_DEFAULT_APP_URL = 'http://localhost:8080/index.html';

export const PUSH_DEFAULT_VAPID_SUBJECT = 'mailto:admin@example.com';

export const PUSH_LIMITS = {
    endpoint: 500,
    p256dh: 200,
    auth: 100,
    userAgent: 255,
    bodyText: 120
} as const;

export const PUSH_SEND_OPTIONS = { TTL: 3600, urgency: 'normal', timeout: 5000 } as const;

export const PUSH_UNUSABLE_STATUSES: readonly number[] = [404, 410];
