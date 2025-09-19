// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYwPgwdoFpEzDG16b0jZ3BSwHQTwKd4H0",
  authDomain: "attendance-7b5ce.firebaseapp.com",
  projectId: "attendance-7b5ce",
  storageBucket: "attendance-7b5ce.firebasestorage.app",
  messagingSenderId: "686438753048",
  appId: "1:686438753048:web:bb33a03435a10401fbb46d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
