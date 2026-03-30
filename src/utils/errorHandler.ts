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
 * Maps raw technical error messages to user-friendly English messages.
 */
function getFriendlyErrorMessage(rawMessage: string): string {
  const msg = rawMessage.toLowerCase();
  
  if (msg.includes('missing or insufficient permissions')) {
    return "You don't have permission to perform this action.";
  }
  if (msg.includes('quota exceeded')) {
    return "The application has reached its usage limit. Please try again later.";
  }
  if (msg.includes('failed to fetch') || msg.includes('network error')) {
    return "Network error. Please check your internet connection.";
  }
  if (msg.includes('the client is offline')) {
    return "You are currently offline. Please check your internet connection.";
  }
  if (msg.includes('api_key is missing') || msg.includes('api key not valid')) {
    return "The service is not configured properly. Please contact support.";
  }
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
    return "Invalid login credentials. Please try again.";
  }
  if (msg.includes('popup-closed-by-user')) {
    return "Login was cancelled.";
  }
  if (msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand')) {
    return "The AI model is currently experiencing high demand. Please try again in a few moments.";
  }
  
  // If it's a very long error message, it's likely a raw stack trace or complex error.
  // Return a generic message to avoid showing code to the user.
  if (rawMessage.length > 100) {
    return "An unexpected error occurred. Please try again later.";
  }

  return rawMessage;
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
