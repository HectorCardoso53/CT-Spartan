import { db, protectRoute } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

protectRoute();

// ===== STATE =====
let alunos = [];
let editingId = null;
let hoje = new Date();

// ===== CARREGAR ALUNOS =====
async function carregarAlunos() {
  const snap = await getDocs(collection(db, "alunos"));

  alunos = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  renderDashboard();
  renderAlunos();
}