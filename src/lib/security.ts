import crypto from 'crypto';

/**
 * Validates if a string is a well-formed email address.
 * @param email The email string to validate.
 * @returns boolean indicating if the email is valid.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates a SHA-256 hash of the normalized email address.
 * Normalization includes trimming whitespace and converting to lowercase.
 * @param email The email string to hash.
 * @returns The SHA-256 hash as a hex string.
 */
export function hashEmail(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return crypto
    .createHash('sha256')
    .update(normalizedEmail)
    .digest('hex');
}
