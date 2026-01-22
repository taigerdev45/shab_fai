const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

let serviceAccount;
try {
  serviceAccount = require("./serviceAccount.json");
} catch (e) {
  console.warn("Service account file not found. Using environment variables.");
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

const projectId = serviceAccount.project_id || serviceAccount.projectId;

if (projectId && admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${projectId}.firebasestorage.app`
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };