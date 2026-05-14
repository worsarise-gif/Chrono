import { db } from '../src/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

async function migrate() {
  const usersRef = db.collection('users');
  const usersSnapshot = await usersRef.get();

  for (const userDoc of usersSnapshot.docs) {
    const imagesRef = userDoc.ref.collection('generated_images');
    const imagesSnapshot = await imagesRef.get();

    for (const imageDoc of imagesSnapshot.docs) {
      const data = imageDoc.data();
      if (data.imageData && !data.imageUrl) {
        try {
          const bucket = admin.storage().bucket();
          const file = bucket.file(`generated_images/${userDoc.id}/${imageDoc.id}.png`);
          const base64Data = data.imageData.split(',').pop();
          const buffer = Buffer.from(base64Data, 'base64');

          await file.save(buffer, {
            contentType: 'image/png',
            metadata: { cacheControl: 'public, max-age=31536000' }
          });
          await file.makePublic();

          const imageUrl = file.publicUrl();

          await imageDoc.ref.update({
            imageUrl,
            imageData: admin.firestore.FieldValue.delete()
          });
          console.log(`Migrated image ${imageDoc.id} for user ${userDoc.id}`);
        } catch (e) {
          console.error(`Failed to migrate image ${imageDoc.id} for user ${userDoc.id}`, e);
        }
      }
    }
  }
  console.log('Migration complete.');
}

migrate().catch(console.error);
