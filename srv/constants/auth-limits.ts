export const AUTH_LIMITS = {
    maxAttemptsPerWindow: 20,
    windowInMinutes: 15,
    maxLoginAttemptsPerAccount: 10,
    maxCredentialLength: 256,
    minPasswordLength: 6,
    maxPasswordLength: 72,
    maxEmailLength: 120,
    maxDisplayNameLength: 80,
    bcryptCost: 10,
    accessTokenSeconds: 3600,
    refreshTokenDays: 30,
    refreshTokenBytes: 48,
    mediaTokenSeconds: 24 * 60 * 60
} as const;

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
