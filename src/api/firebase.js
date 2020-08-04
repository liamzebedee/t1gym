const admin = require("firebase-admin")
const atob = require('atob')

// We encode the Google serviceAccountKey in base64.
// See: https://github.com/vercel/vercel/issues/749
const serviceAccountBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
if(!serviceAccountBase64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is undefined.")
}
const serviceAccount = JSON.parse(atob(serviceAccountBase64))

// Next.js doesn't have a catch-all initialization function for the API
// server. So we will call FirebaseAdmin.initializeApp multiple times.
// Copied from: https://leerob.io/blog/nextjs-firebase-serverless
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://diasim.firebaseio.com"
  })
} catch (error) {
  /*
   * We skip the "already exists" message which is
   * not an actual error when we're hot-reloading.
   */
  if (!/already exists/u.test(error.message)) {
    // eslint-disable-next-line no-console
    console.error('Firebase admin initialization error', error.stack);
  }
}

export { admin }