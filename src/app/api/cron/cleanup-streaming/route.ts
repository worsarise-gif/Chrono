import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // We need to query across all messages subcollections
    // This requires a collectionGroup query. Note: Needs index in firestore.indexes.json
    const snapshot = await db.collectionGroup('messages')
      .where('isStreaming', '==', true)
      .where('createdAt', '<', twoMinutesAgo)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const content = (data.content || '') + '\n\n[Response interrupted by server]';
      batch.update(doc.ref, {
        isStreaming: false,
        content
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: snapshot.docs.length });
  } catch (error: any) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
