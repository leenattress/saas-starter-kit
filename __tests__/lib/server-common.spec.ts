import type { NextApiRequest } from 'next';

import { extractAuthToken, generateToken, validateEmail, slugify, forceConsume } from '../../lib/server-common';

describe('Lib - server-common', () => {
  describe('generateToken', () => {
    it('should create a random string with default length 64', () => {
      const result = generateToken();
      expect(result).toBeTruthy();
      expect(result.length).toBe(64);
    });

    it('should create a random string with specified length', () => {
      const length = Math.round(Math.random() * 10) + 1;
      const result = generateToken(length);
      expect(result).toBeTruthy();
      expect(result.length).toBe(length);
    });
  });

  describe('extractAuthToken', () => {
    it('should return a token for a bearer token', () => {
      const token = generateToken(10);
      const mock = {
        headers: { authorization: `Bearer ${token}` },
      } as NextApiRequest;
      const result = extractAuthToken(mock);
      expect(result).toBe(token);
    });

    it('should return null when authorization header is missing', () => {
      const mock = { headers: {} } as NextApiRequest;
      const result = extractAuthToken(mock);
      expect(result).toBeNull();
    });

    it('should return null when token is empty', () => {
      const mock = { headers: { authorization: '' } } as NextApiRequest;
      const result = extractAuthToken(mock);
      expect(result).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('should return true for a valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should return false for an invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('slugify', () => {
    it('should convert text to a slug', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
    });

    it('should handle text with multiple spaces and special characters', () => {
      expect(slugify('  Hello   World!  ')).toBe('hello-world');
    });
  });

  describe('forceConsume', () => {
    it('should consume the response body without errors', async () => {
      const mockResponse = {
        text: jest.fn().mockResolvedValue('response body'),
      };
      await expect(forceConsume(mockResponse)).resolves.toBeUndefined();
      expect(mockResponse.text).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockResponse = {
        text: jest.fn().mockRejectedValue(new Error('Failed to read response')),
      };
      await expect(forceConsume(mockResponse)).resolves.toBeUndefined();
      expect(mockResponse.text).toHaveBeenCalled();
    });
  });
});
