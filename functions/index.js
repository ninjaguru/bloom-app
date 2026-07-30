const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * When a document is created in adminBroadcasts with status 'pending',
 * send FCM push notifications to all customers who have an FCM token.
 */
exports.sendBroadcastNotification = functions.firestore
  .document('adminBroadcasts/{broadcastId}')
  .onCreate(async (snap) => {
    const { title, body, status } = snap.data();

    if (status !== 'pending') return;

    const broadcastRef = snap.ref;

    try {
      // Fetch all customers that have an FCM token
      const customersSnap = await db.collection('customers').get();

      const tokens = [];
      const uidTokenMap = [];

      customersSnap.forEach((doc) => {
        const token = doc.data().fcmToken;
        if (token) {
          tokens.push(token);
          uidTokenMap.push({ uid: doc.id, token });
        }
      });

      if (tokens.length === 0) {
        await broadcastRef.update({ status: 'sent', recipientCount: 0, note: 'No FCM tokens found' });
        return;
      }

      const message = {
        notification: { title, body },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Write in-app notifications for all customers
      const batch = db.batch();
      let successCount = 0;

      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          successCount++;
          const { uid } = uidTokenMap[idx];
          const notifRef = db.collection('customers').doc(uid).collection('notifications').doc();
          batch.set(notifRef, {
            title,
            body,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await batch.commit();

      await broadcastRef.update({
        status: 'sent',
        recipientCount: successCount,
        totalAttempted: tokens.length,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Broadcast send failed:', error);
      await broadcastRef.update({
        status: 'failed',
        error: error.message,
      });
    }
  });
