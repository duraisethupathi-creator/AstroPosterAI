import type {ErrorRequestHandler} from 'express';
import type {AIErrorCode} from '../../../src/types/generation';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: AIErrorCode) {
    super(code);
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (res.headersSent) return;
  if (error instanceof ApiError) {
    console.info(JSON.stringify({classification: error.code}));
    res.status(error.status).json({success: false, error: {code: error.code}});
  } else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
    res.status(413).json({success: false, error: {code: 'BODY_TOO_LARGE'}});
  } else if (error instanceof SyntaxError) {
    res.status(400).json({success: false, error: {code: 'INVALID_REQUEST'}});
  } else {
    // Never return/log exception messages, request bodies, SDK responses or keys.
    res.status(500).json({success: false, error: {code: 'SERVER_ERROR'}});
  }
};
