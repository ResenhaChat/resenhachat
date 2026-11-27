export const MEMBER_EDITABLE_FIELDS: readonly string[] = ['ID', 'IsPinned', 'IsArchived', 'MutedUntil'];

export const MEMBER_ROLES = {
    Owner: 'Owner',
    Admin: 'Admin',
    Member: 'Member'
} as const;

export const ASSIGNABLE_ROLES: readonly string[] = [MEMBER_ROLES.Admin, MEMBER_ROLES.Member];
