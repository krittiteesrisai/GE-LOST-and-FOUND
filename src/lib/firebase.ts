import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

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
const db = getFirestore(app, "ai-studio-5697621d-4a6b-4994-bdec-e088fb1401d9");

export { 
  app, 
  db, 
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
