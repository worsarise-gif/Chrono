import admin from "firebase-admin";

function initFirebaseAdmin() {
  if (admin?.apps?.length > 0) return admin.apps[0]!;

  // Allow tests to bypass initialization by setting NODE_ENV=test
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
    // During next build, env vars are missing so mock it
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      return admin.initializeApp({ projectId: 'test-project' });
    }
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKey) throw new Error("FIREBASE_PRIVATE_KEY is not set");
  if (!process.env.FIREBASE_PROJECT_ID) throw new Error("FIREBASE_PROJECT_ID is not set");
  if (!process.env.FIREBASE_CLIENT_EMAIL) throw new Error("FIREBASE_CLIENT_EMAIL is not set");
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const app = initFirebaseAdmin();
export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export const db = adminDb; // Export db as well since existing imports might use it
export const auth = adminAuth; // Export auth as well
