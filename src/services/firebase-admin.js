// lib/firebase-admin.js
import admin from 'firebase-admin';

// Path to the service account key file
import serviceAccount from './voice-ai.js'; // Use import instead of require

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: 'https://your-project-id.firebaseio.com', // Replace with your project's database URL
  });
}

// Named export
export { admin };
