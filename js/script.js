import { db, logout, protectRoute } from "./firebase.js";
import {
  collection, getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { setAlunos, setPagamentos } from "./state.js";
import { showLoading, hideLoading } from "./utils.js";

import { renderDashboard } from "./dashboard.js";
import {
  renderAlunos, renderAlunosFiltrados,
  openModal, closeModal, onModalChange,
  editAluno, deleteAluno, saveAluno,
  populateHorarioFilter,
} from "./alunos.js";
import {
  carregarPagamentos, renderPagamentos,
  abrirModalPagamento, fecharModalPagamento,
  confirmarPagamento, registrarPagamento,
} from "./pagamentos.js";
import { renderTurmas, abrirTurma, filtrarPorTurma } from "./turmas.js";
import { renderAvaliacoes, marcarRealizada } from "./avaliacoes.js";
import { renderAlertas } from "./alertas.js";
import { renderTreinoLivre } from "./treinoLivre.js";
import { openWhatsApp, openWhatsAppAvaliacao, openWhatsAppBoasVindas, openWhatsAppAniversario, transmitirSolicitarNascimento } from "./whatsapp.js";

protectRoute();

// ===== NAVEGAÇÃO =====
function navigate(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll(".nav-item").forEach((n) => {
    if (n.textContent.toLowerCase().includes(page === "dashboard" ? "dash" : page.slice(0, 4)))
      n.classList.add("active");
  });

  const titles = {
    dashboard: "Dashboard",
    alunos: "Alunos",
    turmas: "Turmas & Horários",
    avaliacoes: "Avaliações Físicas",
    alertas: "Alertas",
    "treino-livre": "Treino Livre",
    pagamentos: "Pagamentos",
  };
  document.getElementById("page-title").textContent = titles[page] || page;

  if (page === "dashboard") renderDashboard();
  if (page === "alunos") renderAlunos();
  if (page === "turmas") renderTurmas();
  if (page === "avaliacoes") renderAvaliacoes();
  if (page === "alertas") renderAlertas();
  if (page === "treino-livre") renderTreinoLivre();
  if (page === "pagamentos") carregarPagamentos();

  if (window.innerWidth <= 600) {
    document.querySelector(".sidebar").classList.remove("open");
  }
}

// ===== CARREGAMENTO INICIAL =====
async function carregarAlunos() {
  showLoading("Carregando alunos...");
  try {
    const [snapAlunos, snapPag] = await Promise.all([
      getDocs(collection(db, "alunos")),
      getDocs(collection(db, "pagamentos")),
    ]);

    setAlunos(snapAlunos.docs.map((d) => ({ id: d.id, ...d.data() })));
    setPagamentos(snapPag.docs.map((d) => ({ id: d.id, ...d.data() })));

    document.getElementById("filter-mes").value = new Date().toISOString().slice(0, 7);

    renderDashboard();
    populateHorarioFilter();
    renderAlunos();
    renderAvaliacoes();
    renderPagamentos();
  } finally {
    hideLoading();
  }
}

// ===== MENU MOBILE =====
function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("open");
}

document.addEventListener("click", function (e) {
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.querySelector(".menu-toggle");
  if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

// ===== LISTENERS DE FILTRO =====
document.getElementById("filter-modal")?.addEventListener("change", renderAlunos);
document.getElementById("filter-horario")?.addEventListener("change", renderAlunos);
document.getElementById("search-aluno")?.addEventListener("input", renderAlunos);
document.getElementById("filter-aval-status")?.addEventListener("change", renderAvaliacoes);

// ===== INIT =====
carregarAlunos();

// ===== EXPORTS GLOBAIS (usados nos onclick do HTML) =====
window.navigate = navigate;
window.carregarAlunos = carregarAlunos;
window.toggleMenu = toggleMenu;
window.logout = logout;

window.openModal = openModal;
window.closeModal = closeModal;
window.onModalChange = onModalChange;
window.saveAluno = saveAluno;
window.editAluno = editAluno;
window.deleteAluno = deleteAluno;
window.renderAlunos = renderAlunos;
window.renderAlunosFiltrados = renderAlunosFiltrados;

window.abrirModalPagamento = abrirModalPagamento;
window.fecharModalPagamento = fecharModalPagamento;
window.confirmarPagamento = confirmarPagamento;
window.registrarPagamento = registrarPagamento;
window.renderPagamentos = renderPagamentos;

window.renderTurmas = renderTurmas;
window.renderTreinoLivre = renderTreinoLivre;
window.abrirTurma = abrirTurma;
window.filtrarPorTurma = filtrarPorTurma;

window.marcarRealizada = marcarRealizada;
window.openWhatsApp = openWhatsApp;
window.openWhatsAppAvaliacao = openWhatsAppAvaliacao;
window.openWhatsAppBoasVindas = openWhatsAppBoasVindas;
window.openWhatsAppAniversario = openWhatsAppAniversario;
window.transmitirSolicitarNascimento = transmitirSolicitarNascimento;
