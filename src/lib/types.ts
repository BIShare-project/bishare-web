export interface APIError {
  code: string;
  message: string;
}

/** Standard backend envelope: `{success:true,data}` / `{success:false,error}`. */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

/** Flat (non-enveloped) responses: transfer delete, request upload, contact. */
export interface FlatResponse {
  success: boolean;
  message?: string;
  error?: APIError;
}

/**
 * Flat 200 body of POST /api/v1/transfer/upload.
 * `code` is display-formatted (ABC-DEF), `rawCode` is the 6-char code.
 */
export interface TransferUploadResponse {
  success: boolean;
  code?: string;
  rawCode?: string;
  expiresAt?: string;
  deleteToken?: string;
  error?: APIError;
}

/** GET /api/v1/transfer/status/:code — `senderAlias` is omitted when absent. */
export interface TransferStatus {
  code: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  senderAlias?: string;
  oneTime: boolean;
  isDownloaded: boolean;
  expiresAt: string;
}
