const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function list() {
  const snap = await db.collection('companies').get();
  snap.docs.forEach(doc => console.log(doc.id, '|', doc.data().name));
}

list().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
