export const DOC_TYPES_IDS = [
    'global-properties',
    'node-types',
    'files-types',
    'comments-types',
    'users-types',
    'version-history-types',
    'projects-types',
    'library-items-types',
] as const;

export type DOC_TYPE_ID = typeof DOC_TYPES_IDS[any];

export const DOC_ENDPOINTS_IDS = [
    'get-comments-endpoint',
    'get-component-endpoint',
    'get-file-nodes-endpoint',
    'get-file-versions-endpoint',
    'get-files-endpoint',
    'get-image-fills-endpoint',
    'get-images-endpoint',
    'get-me-endpoint',
    'get-project-files-endpoint',
    'get-style-endpoint',
    'get-team-components-endpoint',
    'get-team-projects-endpoint',
    'get-team-styles-endpoint',
    'post-comments-endpoint',
] as const;

export type DOC_ENDPOINT_ID = typeof DOC_ENDPOINTS_IDS[any];

export type DOC_PARTS_ID = DOC_TYPE_ID | DOC_ENDPOINT_ID;