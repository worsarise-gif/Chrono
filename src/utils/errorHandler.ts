import { toast } from 'sonner';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AppErrorOptions {
  severity?: ErrorSeverity;
  showToast?: boolean;
  context?: Record<string, any>;
}

export class AppError extends Error {
  public severity: ErrorSeverity;
  public context?: Record<string, any>;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.context = options.context;
  }
}

/**
 * A central error handler for the application.
 * Logs errors to the console and optionally shows a toast notification to the user.
 */
export const handleError = (error: unknown, customMessage?: string, options: AppErrorOptions = { showToast: true }) => {
  let message = customMessage || 'An unexpected error occurred';
  let severity = options.severity || ErrorSeverity.ERROR;
  let context = options.context || {};

  if (error instanceof AppError) {
    message = customMessage || error.message;
    severity = error.severity;
    context = { ...error.context, ...context };
  } else if (error instanceof Error) {
    // Check if it's a serialized Firestore error
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error && parsed.operationType) {
        message = customMessage || `Database error: ${parsed.error}`;
        context = { ...parsed, ...context };
      } else {
        message = customMessage || error.message;
      }
    } catch {
      message = customMessage || error.message;
    }
  } else if (typeof error === 'string') {
    message = customMessage || error;
  }

  // Log to console for debugging
  const logMethod = severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR ? console.error : 
                    severity === ErrorSeverity.WARNING ? console.warn : console.info;
  
  logMethod(`[${severity.toUpperCase()}] ${message}`, { originalError: error, context });

  // Show toast to user
  if (options.showToast !== false) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        toast.error(message);
        break;
      case ErrorSeverity.WARNING:
        toast.warning(message);
        break;
      case ErrorSeverity.INFO:
        toast.info(message);
        break;
      default:
        toast(message);
    }
  }

  return { message, severity, context };
};
