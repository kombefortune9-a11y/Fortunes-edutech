import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function run() {
  try {
    const snapshot = await getDocs(collection(db, 'shared_music'));
    console.log("Tracks in Firestore:", snapshot.docs.length);
    snapshot.forEach(doc => {
      console.log("-", doc.id, doc.data().title);
    });
  } catch (e) {
    console.error("Error fetching:", e);
  }
  process.exit(0);
}

run();
