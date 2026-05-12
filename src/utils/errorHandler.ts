import { toast } from 'sonner';

export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

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
 * Maps raw technical error messages to user-friendly English messages.
 */
export function getFriendlyErrorMessage(rawMessage: string): string {
  if (!rawMessage) return "An unexpected error occurred. Please try again later.";
  
  const msg = rawMessage.toLowerCase();
  
  // Network & Connectivity
  if (msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('cors')) {
    return "We're having trouble connecting to the server. Please check your internet connection and try again.";
  }
  if (msg.includes('the client is offline') || msg.includes('offline')) {
    return "You appear to be offline. Please check your internet connection.";
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return "The request took too long to complete. Please try again.";
  }

  // Authentication & Authorization
  if (msg.includes('missing or insufficient permissions') || msg.includes('permission-denied')) {
    return "You don't have permission to perform this action.";
  }
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
    return "Invalid login credentials. Please check your email and password and try again.";
  }
  if (msg.includes('popup-closed-by-user')) {
    return "Login was cancelled.";
  }
  if (msg.includes('unauthorized') || msg.includes('unauthenticated')) {
    return "You need to be logged in to do this. Please sign in and try again.";
  }

  // Quotas & Rate Limits
  if (msg.includes('quota exceeded') || msg.includes('quota')) {
    return "The application has reached its usage limit. Please try again later.";
  }
  if (msg.includes('429') || msg.includes('too many requests') || msg.includes('rate limit')) {
    return "You're making requests too quickly. Please wait a moment and try again.";
  }

  // Server & Model Errors
  if (msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand') || msg.includes('overloaded')) {
    return "The AI model is currently experiencing high demand. Please try again in a few moments.";
  }
  if (msg.includes('500') || msg.includes('internal server error')) {
    return "We experienced an internal server issue. Please try again later.";
  }

  // Configuration & Setup
  if (msg.includes('api_key is missing') || msg.includes('api key not valid') || msg.includes('invalid api key')) {
    return "The service is not configured properly. Please contact support.";
  }

  // Input Validation
  if (msg.includes('invalid argument') || msg.includes('bad request') || msg.includes('400')) {
    return "The provided input was invalid. Please check your request and try again.";
  }
  if (msg.includes('payload too large') || msg.includes('413')) {
    return "The file or request is too large. Please try a smaller file or shorter message.";
  }

  // If it's a very long error message, it's likely a raw stack trace or complex error.
  // Return a generic message to avoid showing code to the user.
  if (rawMessage.length > 100 || msg.includes('typeerror') || msg.includes('referenceerror') || msg.includes('syntaxerror')) {
    return "An unexpected error occurred. Please try again later.";
  }

  // Capitalize the first letter and ensure it ends with a period if it's a short, unhandled error
  const formatted = rawMessage.charAt(0).toUpperCase() + rawMessage.slice(1);
  return formatted.endsWith('.') ? formatted : `${formatted}.`;
}

/**
 * A central error handler for the application.
 * Logs errors to the console and optionally shows a toast notification to the user.
 */
export const handleError = (error: unknown, customMessage?: string, options: AppErrorOptions = { showToast: true }) => {
  let rawErrorMessage = 'An unexpected error occurred';
  let severity = options.severity || ErrorSeverity.ERROR;
  let context = options.context || {};

  if (error instanceof AppError) {
    rawErrorMessage = error.message;
    severity = error.severity;
    context = { ...error.context, ...context };
  } else if (error instanceof Error) {
    // Check if it's a serialized Firestore error
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error && parsed.operationType) {
        rawErrorMessage = parsed.error;
        context = { ...parsed, ...context };
      } else {
        rawErrorMessage = error.message;
      }
    } catch {
      rawErrorMessage = error.message;
    }
  } else if (typeof error === 'string') {
    rawErrorMessage = error;
  } else if (error && typeof error === 'object') {
    if ('message' in error && typeof (error as any).message === 'string') {
      rawErrorMessage = (error as any).message;
    } else if ('error' in error && typeof (error as any).error === 'string') {
      rawErrorMessage = (error as any).error;
    }
  }

  // Determine the final message to show to the user
  const friendlyMessage = getFriendlyErrorMessage(rawErrorMessage);
  
  let displayMessage = friendlyMessage;
  if (customMessage) {
    // If the friendly message is just a generic error or the raw error, just use the custom message.
    // Otherwise, combine them to give more context.
    if (friendlyMessage === rawErrorMessage || friendlyMessage === "An unexpected error occurred. Please try again later.") {
      displayMessage = customMessage;
    } else {
      displayMessage = `${customMessage}: ${friendlyMessage}`;
    }
  }

  // Log to console for debugging
  const logMethod = severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR ? console.error : 
                    severity === ErrorSeverity.WARNING ? console.warn : console.info;
  
  logMethod(`[${severity.toUpperCase()}] ${displayMessage}`, { originalError: error, rawErrorMessage, context });

  // Show toast to user
  if (options.showToast !== false) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        // Use default toast style (gray/neutral) instead of red toast.error
        toast(displayMessage);
        break;
      case ErrorSeverity.WARNING:
        toast.warning(displayMessage);
        break;
      case ErrorSeverity.INFO:
        toast.info(displayMessage);
        break;
      default:
        toast(displayMessage);
    }
  }

  return { message: displayMessage, severity, context };
};
