const admin = require('firebase-admin');
//const serviceAccount = require('./serviceAccountKey.json');
const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized');
} else {
    console.log('⚠️ Firebase already initialized');
}


module.exports = admin;
