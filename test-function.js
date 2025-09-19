// Simple test script for Firebase Functions
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
  apiKey: "AIzaSyCMuPp8kXVgBkHKxxEt2XIX6mwr_tRR_jc",
  authDomain: "peakflow-3a2ed.firebaseapp.com",
  projectId: "peakflow-3a2ed",
  storageBucket: "peakflow-3a2ed.firebasestorage.app",
  messagingSenderId: "244374297943",
  appId: "1:244374297943:web:bdb6cdfc855059a88f7212"
};

async function testFunction() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app, 'us-central1');

    console.log('Please provide test credentials:');
    const email = 'test@example.com'; // Replace with actual test account
    const password = 'testpassword'; // Replace with actual password

    console.log('Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user.uid);

    console.log('Getting ID token...');
    const token = await userCredential.user.getIdToken();
    console.log('Token length:', token.length);

    console.log('Calling getExtractionTypes function...');
    const getTypes = httpsCallable(functions, 'getExtractionTypes');
    const result = await getTypes();

    console.log('Function result:', result.data);

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
  }
}

testFunction();