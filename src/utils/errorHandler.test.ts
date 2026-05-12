import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AppError, ErrorSeverity, getFriendlyErrorMessage, handleError } from './errorHandler.ts';

describe('errorHandler', () => {
  describe('AppError', () => {
    test('should create an error with default severity', () => {
      const error = new AppError('Test error');
      assert.strictEqual(error.message, 'Test error');
      assert.strictEqual(error.severity, ErrorSeverity.ERROR);
      assert.strictEqual(error.name, 'AppError');
    });

    test('should create an error with custom severity and context', () => {
      const context = { userId: '123' };
      const error = new AppError('Critical error', {
        severity: ErrorSeverity.CRITICAL,
        context,
      });
      assert.strictEqual(error.severity, ErrorSeverity.CRITICAL);
      assert.deepStrictEqual(error.context, context);
    });
  });

  describe('getFriendlyErrorMessage', () => {
    test('should handle empty input', () => {
      assert.strictEqual(getFriendlyErrorMessage(''), "An unexpected error occurred. Please try again later.");
    });

    test('should map network errors', () => {
      assert.ok(getFriendlyErrorMessage('failed to fetch').includes("trouble connecting"));
      assert.ok(getFriendlyErrorMessage('the client is offline').includes("appear to be offline"));
      assert.ok(getFriendlyErrorMessage('timeout').includes("took too long"));
    });

    test('should map auth errors', () => {
      assert.ok(getFriendlyErrorMessage('permission-denied').includes("don't have permission"));
      assert.ok(getFriendlyErrorMessage('invalid-credential').includes("Invalid login credentials"));
      assert.ok(getFriendlyErrorMessage('unauthorized').includes("need to be logged in"));
    });

    test('should map quota errors', () => {
      assert.ok(getFriendlyErrorMessage('quota exceeded').includes("usage limit"));
      assert.ok(getFriendlyErrorMessage('rate limit').includes("too quickly"));
    });

    test('should map server errors', () => {
      assert.ok(getFriendlyErrorMessage('503').includes("high demand"));
      assert.ok(getFriendlyErrorMessage('internal server error').includes("internal server issue"));
    });

    test('should map input validation errors', () => {
      assert.ok(getFriendlyErrorMessage('invalid argument').includes("input was invalid"));
      assert.ok(getFriendlyErrorMessage('payload too large').includes("too large"));
    });

    test('should return generic message for long messages or stack traces', () => {
      const longMessage = 'a'.repeat(101);
      assert.strictEqual(getFriendlyErrorMessage(longMessage), "An unexpected error occurred. Please try again later.");
      assert.strictEqual(getFriendlyErrorMessage('TypeError: undefined is not a function'), "An unexpected error occurred. Please try again later.");
    });

    test('should format unknown short messages', () => {
      assert.strictEqual(getFriendlyErrorMessage('something went wrong'), 'Something went wrong.');
      assert.strictEqual(getFriendlyErrorMessage('Already formatted.'), 'Already formatted.');
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      mock.method(console, 'error', () => {});
      mock.method(console, 'warn', () => {});
      mock.method(console, 'info', () => {});
    });

    test('should handle AppError', () => {
      const error = new AppError('original message', { severity: ErrorSeverity.WARNING });
      const result = handleError(error, undefined, { showToast: false });

      assert.strictEqual(result.severity, ErrorSeverity.WARNING);
    });

    test('should handle standard Error', () => {
      const error = new Error('failed to fetch');
      const result = handleError(error, undefined, { showToast: false });

      assert.ok(result.message.includes("trouble connecting"));
      assert.strictEqual(result.severity, ErrorSeverity.ERROR);
    });

    test('should handle Firestore-like JSON error', () => {
      const firestoreError = JSON.stringify({ error: 'permission-denied', operationType: 'update' });
      const error = new Error(firestoreError);
      const result = handleError(error, undefined, { showToast: false });

      assert.ok(result.message.includes("don't have permission"));
      assert.strictEqual(result.context.operationType, 'update');
    });

    test('should handle string error', () => {
      const result = handleError('offline', undefined, { showToast: false });
      assert.ok(result.message.includes("appear to be offline"));
    });

    test('should combine custom message', () => {
      const result = handleError('offline', 'Action failed', { showToast: false });
      assert.strictEqual(result.message, 'Action failed: You appear to be offline. Please check your internet connection.');
    });

    test('should use custom message if friendly message is generic', () => {
      const result = handleError('TypeError: fail', 'Custom task failed', { showToast: false });
      assert.strictEqual(result.message, 'Custom task failed');
    });

    test('should return correct object structure', () => {
      const result = handleError('test', undefined, { showToast: false });
      assert.ok('message' in result);
      assert.ok('severity' in result);
      assert.ok('context' in result);
    });
  });
});
