const KB = 1024;

const MB = 1024 * KB;

export const MEDIA_LIMITS = {
    imageMaxBytes: 10 * MB,
    videoMaxBytes: 25 * MB,
    fileMaxBytes: 25 * MB,
    thumbnailMaxBytes: 300 * KB,
    avatarMaxBytes: 10 * MB,
    imageMaxDimension: 1600,
    thumbnailDimension: 400,
    avatarDimension: 512,
    maxPixelDimension: 10000,
    maxDurationSeconds: 3600,
    maxInputPixels: 50000000,
    maxGifPages: 300,
    maxPendingUploads: 10,
    maxConcurrentWrites: 4
} as const;

export const UPLOAD_KINDS = {
    Image: 'Image',
    Video: 'Video',
    File: 'File'
} as const;

export const IMAGE_FORMATS: Readonly<Record<string, string>> = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
};

export const IMAGE_MIME_TYPES: readonly string[] = Object.keys(IMAGE_FORMATS);

export const VIDEO_MIME_TYPES: readonly string[] = ['video/mp4', 'video/webm', 'video/quicktime'];

export const AVATAR_MIME_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

export const THUMBNAIL_MIME_TYPES: readonly string[] = ['image/jpeg', 'image/webp'];

export const PDF_MIME_TYPE = 'application/pdf';

export const BLOCKED_FILE_EXTENSIONS: readonly string[] = [
    'exe', 'bat', 'cmd', 'com', 'msi', 'msp', 'scr', 'js', 'mjs', 'vbs', 'vbe', 'wsf', 'ps1', 'sh', 'apk', 'jar', 'dll',
    'hta', 'lnk', 'pif', 'reg', 'cpl', 'msix', 'appx', 'html', 'htm', 'xhtml', 'xml', 'svg', 'svgz'
];

export const FILE_NAME_CONTROL_PATTERN = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g;

export const FILE_NAME_TRAILING_PATTERN = /[. ]+$/;

export const MIME_TYPE_PATTERN = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i;

export const MEDIA_READ_PATH_PATTERN = /^\/service\/Chat\/.+\/(Avatar|Content|Thumbnail)(\/\$value)?$/;

export const MEDIA_TOKEN_PARAM_PATTERN = /([?&])mt=[^&]*(&|$)/;

export const FILE_NAME_MAX_LENGTH = 255;

export const IMAGE_OUTPUT_MIME = 'image/webp';

export const IMAGE_OUTPUT_QUALITY = 80;

export const THUMBNAIL_QUALITY = 75;

export const AVATAR_QUALITY = 85;

export const MEDIA_CACHE_CONTROL = 'private, max-age=31536000, immutable';
