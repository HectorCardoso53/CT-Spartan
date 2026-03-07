// 🔥 Firebase Centralizado

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfeRXaLNSNH1JlFgy5I8Ccw6Ko9FvGtig",
  authDomain: "ctsparta-fa2e5.firebaseapp.com",
  projectId: "ctsparta-fa2e5",
  storageBucket: "ctsparta-fa2e5.firebasestorage.app",
  messagingSenderId: "509040275933",
  appId: "1:509040275933:web:0ec490ba2025557609c634",
  measurementId: "G-V5PXMPH3CN",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// 🔐 Proteção de rota
function protectRoute() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
    }
  });
}

// 🚪 Logout
async function logout() {
  await signOut(auth);
  window.location.href = "index.html";
}

export { auth, db, protectRoute, logout };