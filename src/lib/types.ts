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

/**
 * GET /s/:token — the backend omits `file_*` for folder shares and
 * `folder_name` for file shares, so all of those are optional.
 */
export interface PublicShareInfo {
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  folder_name?: string;
  has_password: boolean;
  is_expired: boolean;
}

export interface DownloadURLResponse {
  download_url: string;
  expires_in: number;
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

/**
 * GET /api/v1/requests/:code — nullable columns are omitted by the backend
 * when unset, so they are optional here.
 */
export interface FileRequestInfo {
  code: string;
  title: string;
  message?: string;
  requester_alias: string;
  max_files?: number;
  max_file_size: number;
  allowed_types?: string;
  upload_count: number;
  is_active: boolean;
  expires_at?: string;
}
