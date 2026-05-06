import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc, updateDoc, doc, query, where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { alunos, pagamentos, setPagamentos, pagamentoAluno, setPagamentoAluno } from "./state.js";
import { showLoading, hideLoading, showToast, fmtDate, calcularIdade } from "./utils.js";

export async function carregarPagamentos() {
  const snap = await getDocs(collection(db, "pagamentos"));
  setPagamentos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  document.getElementById("filter-mes").value = new Date().toISOString().slice(0, 7);
  renderPagamentos();
}

export function renderPagamentos() {
  const q = document.getElementById("search-pagamento")?.value?.toLowerCase() || "";
  const mesFiltro = document.getElementById("filter-mes")?.value || "";
  const modalFiltro = document.getElementById("filter-modalidade-pag")?.value || "";

  const list = pagamentos.filter((p) => {
    if (alunos.length > 0 && !alunos.some((a) => a.id === p.alunoId)) return false;
    if (q && !p.nome.toLowerCase().includes(q)) return false;
    if (mesFiltro && p.mes !== mesFiltro) return false;
    if (modalFiltro && p.modalidade !== modalFiltro) return false;
    return true;
  });

  const total = list.reduce((sum, p) => sum + Number(p.valor), 0);
  document.getElementById("fat-mes").textContent =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  document.getElementById("pagamentos-tbody").innerHTML = list.map((p) => {
    const aluno = alunos.find((a) => a.id === p.alunoId);
    return `<tr>
      <td class="td-name">${p.nome}</td>
      <td>
        ${aluno?.nascimento ? fmtDate(aluno.nascimento) : "-"}<br>
        <small>${aluno?.nascimento ? calcularIdade(aluno.nascimento) + " anos" : ""}</small>
      </td>
      <td>${p.modalidade === "funcional" ? "Funcional" : "Musculação"}</td>
      <td>${p.mes}</td>
      <td>R$ ${Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      <td>${fmtDate(p.data)}</td>
    </tr>`;
  }).join("");

  document.getElementById("pagamentos-empty").style.display = list.length ? "none" : "block";
}

export async function abrirModalPagamento(idx) {
  const aluno = alunos[idx];
  setPagamentoAluno(aluno);

  document.getElementById("p-nome").value = aluno.nome;
  document.getElementById("p-modalidade").value = aluno.modalidade === "funcional" ? "Funcional" : "Musculação";
  document.getElementById("p-valor").value =
    "R$ " + Number(aluno.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("p-data").value = new Date().toISOString().slice(0, 10);

  const snap = await getDocs(
    query(collection(db, "pagamentos"), where("alunoId", "==", aluno.id)),
  );
  const mesesPagos = snap.docs.map((d) => d.data().mes);

  const mesAtual = new Date().toISOString().slice(0, 7);
  const mesVenc = aluno.vencimento ? aluno.vencimento.slice(0, 7) : mesAtual;
  let mesSugerido = mesVenc < mesAtual ? mesVenc : mesAtual;

  while (mesesPagos.includes(mesSugerido)) {
    const [y, m] = mesSugerido.split("-").map(Number);
    const anterior = new Date(y, m - 2, 1);
    mesSugerido = anterior.toISOString().slice(0, 7);
    if (mesSugerido < "2020-01") break;
  }

  document.getElementById("p-mes").value = mesSugerido;
  document.getElementById("modal-pagamento").classList.add("open");
}

export function fecharModalPagamento() {
  document.getElementById("modal-pagamento").classList.remove("open");
  setPagamentoAluno(null);
}

export async function confirmarPagamento() {
  const current = pagamentoAluno;
  if (!current) return;

  const mes = document.getElementById("p-mes").value;
  const data = document.getElementById("p-data").value;
  const valorStr = document.getElementById("p-valor").value;

  if (!mes) { showToast("Selecione o mês", "error"); return; }
  if (!valorStr) { showToast("Informe o valor do pagamento", "error"); return; }

  const valor = Number(valorStr.replace("R$", "").replace(/\./g, "").replace(",", "."));
  if (!valor || valor <= 0) { showToast("Valor inválido", "error"); return; }

  showLoading("Registrando pagamento...");
  try {
    const snap = await getDocs(
      query(collection(db, "pagamentos"), where("alunoId", "==", current.id), where("mes", "==", mes)),
    );
    if (!snap.empty) { hideLoading(); showToast("Pagamento deste mês já registrado", "error"); return; }

    await addDoc(collection(db, "pagamentos"), {
      alunoId: current.id,
      nome: current.nome,
      modalidade: current.modalidade,
      turma: current.turma || null,
      horario: current.horario || null,
      mes, valor, data,
    });

    const prox = new Date(current.vencimento);
    prox.setMonth(prox.getMonth() + 1);
    await updateDoc(doc(db, "alunos", current.id), {
      vencimento: prox.toISOString().slice(0, 10),
      status: "Ativo",
    });

    fecharModalPagamento();
    showToast("Pagamento registrado");
    await window.carregarAlunos();
  } finally {
    hideLoading();
  }
}

export async function registrarPagamento(idx, mesSelecionado = null) {
  const aluno = alunos[idx];
  const hoje = new Date();
  const mes = mesSelecionado || hoje.toISOString().slice(0, 7);
  const data = hoje.toISOString().slice(0, 10);

  await addDoc(collection(db, "pagamentos"), {
    alunoId: aluno.id,
    nome: aluno.nome,
    modalidade: aluno.modalidade,
    turma: aluno.turma || null,
    horario: aluno.horario || null,
    mes, valor: aluno.valor, data,
  });

  const prox = new Date(aluno.vencimento);
  prox.setMonth(prox.getMonth() + 1);
  await updateDoc(doc(db, "alunos", aluno.id), {
    vencimento: prox.toISOString().slice(0, 10),
    status: "Ativo",
  });

  showToast("Pagamento registrado");
  window.carregarAlunos();
}

// Máscara de valor
const valorPagamento = document.getElementById("p-valor");
if (valorPagamento) {
  valorPagamento.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) { e.target.value = ""; return; }
    value = (parseInt(value) / 100).toFixed(2);
    value = value.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    e.target.value = "R$ " + value;
  });
}
