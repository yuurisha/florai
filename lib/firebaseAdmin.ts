import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT env var");
  }

  let serviceAccount: {
    project_id: string;
    private_key: string;
    client_email: string;
  };

  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (err) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid JSON");
  }

  initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

export function getAdminDb() {
  initAdmin();
  return getFirestore();
}
