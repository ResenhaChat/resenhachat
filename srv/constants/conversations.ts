export const GENERAL_CONVERSATION_ID = '00000000-0000-4000-8000-000000000001';

export const GENERAL_CONVERSATION_NAME = 'Geral';

export const LAST_MESSAGE_PREVIEW_LENGTH = 200;

export const GROUP_KINDS: readonly string[] = ['Group', 'Channel'];

export const CONVERSATION_EDITABLE_FIELDS: readonly string[] = ['ID', 'Name', 'Description', 'IsPublic', 'OnlyAdminsCanPost'];

export const CONVERSATION_LIMITS = {
    maxNameLength: 80,
    maxDescriptionLength: 500,
    maxMembersPerAction: 100
} as const;

export const DIRECT_KEY_SEPARATOR = '_';

export const SYSTEM_MESSAGE_LOCALE = 'pt';
