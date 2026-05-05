import { NextRequest } from 'next/server';
import { auth } from './firebaseAdmin';

/**
 * Verifies the Firebase ID token from the Authorization header.
 * @param req The incoming NextRequest
 * @returns The decoded token if valid, otherwise null.
 */
export async function verifySession(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}
