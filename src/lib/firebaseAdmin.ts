import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // CRITICAL VERCEL FIX: format the private key to handle Vercel's environment variable newline escaping
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

const auth = admin.auth();
const firestoreDatabaseId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || '(default)';
const db = getFirestore(admin.app(), firestoreDatabaseId);

export { admin, auth, db };
