const atob = require('atob')

// We encode the Google serviceAccountKey in base64.
// See: https://github.com/vercel/vercel/issues/749
const serviceAccountBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
if(!serviceAccountBase64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is undefined.")
}
const serviceAccount = JSON.parse(atob(serviceAccountBase64))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://diasim.firebaseio.com"
})

export { admin }