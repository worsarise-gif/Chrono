import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isValidEmail, hashEmail } from './security.ts';

describe('Security Utilities', () => {
  describe('isValidEmail', () => {
    test('should return true for valid emails', () => {
      assert.strictEqual(isValidEmail('test@example.com'), true);
      assert.strictEqual(isValidEmail('user.name+tag@domain.co.uk'), true);
    });

    test('should return false for invalid emails', () => {
      assert.strictEqual(isValidEmail('plainaddress'), false);
      assert.strictEqual(isValidEmail('@domain.com'), false);
      assert.strictEqual(isValidEmail('test@'), false);
      assert.strictEqual(isValidEmail('test@domain'), false); // Simple regex requires a dot in domain part
      assert.strictEqual(isValidEmail('test@.com'), false);
    });
  });

  describe('hashEmail', () => {
    test('should return consistent SHA-256 hex hash', () => {
      const email = 'test@example.com';
      const expectedHash = '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b';
      assert.strictEqual(hashEmail(email), expectedHash);
    });

    test('should normalize email (lowercase and trim)', () => {
      const email1 = '  TEST@example.com  ';
      const email2 = 'test@example.com';
      assert.strictEqual(hashEmail(email1), hashEmail(email2));
    });
  });
});
