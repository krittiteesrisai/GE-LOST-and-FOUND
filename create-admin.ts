import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
const firebaseConfig = {
  projectId: "resolute-mechanic-z53bd",
  appId: "1:274396533699:web:a3bee05a2babc4d82be376",
  apiKey: "AIzaSyDt2vyrixXBne_PteUNihC_qHfeto21cNs",
  authDomain: "resolute-mechanic-z53bd.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
createUserWithEmailAndPassword(auth, "admin@campus.com", "admin1234")
  .then(() => {
    console.log("Admin user created successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error creating user:", error);
    process.exit(1);
  });
