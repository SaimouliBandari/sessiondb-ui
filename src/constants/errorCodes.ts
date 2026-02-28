/**
 * Internal error codes shared between frontend and backend.
 *
 * Backend response shape:
 *   { "success": false, "code": "<ERROR_CODE>", "error": "<human-readable message>" }
 */

export const ERR_INVALID_REQUEST = 'REQ001';  // Invalid request params
export const ERR_UNAUTHORIZED = 'AUTH001'; // Authentication required
export const ERR_FORBIDDEN = 'AUTH002'; // Permission denied
export const ERR_DB_ACCESS_DENIED = 'DB001';   // Database access denied
export const ERR_USER_CREDS_REQ = 'USR001';  // DB credentials missing
export const ERR_USER_CREDS_INV = 'USR002';  // DB credentials invalid
export const ERR_NOT_FOUND = 'RES001';  // Resource not found
export const ERR_INTERNAL_ERROR = 'SYS001';  // Internal server error
