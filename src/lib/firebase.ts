import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User 
} from 'firebase/auth';

const firebaseConfig = {
  projectId: "resolute-mechanic-z53bd",
  appId: "1:274396533699:web:a3bee05a2babc4d82be376",
  apiKey: "AIzaSyDt2vyrixXBne_PteUNihC_qHfeto21cNs",
  authDomain: "resolute-mechanic-z53bd.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-5697621d-4a6b-4994-bdec-e088fb1401d9",
  storageBucket: "resolute-mechanic-z53bd.firebasestorage.app",
  messagingSenderId: "274396533699",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-5697621d-4a6b-4994-bdec-e088fb1401d9");

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { 
  app, 
  db, 
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  Timestamp
};
export type { User };
