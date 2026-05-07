import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { alunos, editingId, setEditingId } from "./state.js";
import {
  showLoading, hideLoading, showToast,
  fmtDate, calcularIdade, diasAteVencer, calcularStatusAluno,
  daysFromNow, statusBadge, turmaLabel, diasParaAniversario,
} from "./utils.js";

export function populateHorarioFilter() {
  const sel = document.getElementById("filter-horario");
  if (!sel) return;

  const horariosMusc = alunos.filter((a) => a.modalidade === "musculacao").map((a) => a.horario);
  const turmasFunc = alunos.filter((a) => a.modalidade === "funcional").map((a) => a.turma);
  const lista = [...new Set([...horariosMusc, ...turmasFunc])].sort();

  sel.innerHTML =
    '<option value="">Todos horários</option>' +
    lista.map((v) =>
      turmaLabel[v]
        ? `<option value="${v}">${turmaLabel[v]}</option>`
        : `<option value="${v}">${v}</option>`,
    ).join("");
}

export function renderAlunos() {
  const q = document.getElementById("search-aluno").value.toLowerCase();
  const modal = document.getElementById("filter-modal").value;
  const status = document.getElementById("filter-status").value;
  const horEl = document.getElementById("filter-horario");
  const hor = horEl ? horEl.value : "";

  const list = alunos.filter((a) => {
    if (q && !a.nome.toLowerCase().includes(q)) return false;
    if (modal && a.modalidade !== modal) return false;
    if (status && calcularStatusAluno(a) !== status) return false;
    if (hor) {
      if (a.modalidade === "musculacao" && a.horario !== hor) return false;
      if (a.modalidade === "funcional" && a.turma !== hor) return false;
    }
    return true;
  });

  document.getElementById("alunos-empty").style.display = list.length ? "none" : "block";

  document.getElementById("alunos-tbody").innerHTML = list.map((a) => {
    const idx = alunos.indexOf(a);
    const dias = diasAteVencer(a.vencimento);
    let vencLabel = fmtDate(a.vencimento);
    let vencColor = "var(--muted)";
    if (dias < 0) { vencLabel = `Vencido ${Math.abs(dias)}d`; vencColor = "var(--danger)"; }
    if (dias === 0) { vencLabel = "Vence HOJE"; vencColor = "var(--gold)"; }
    if (dias > 0 && dias <= 3) { vencLabel = `Vence em ${dias}d`; vencColor = "var(--gold)"; }

    const horario = a.modalidade === "funcional" ? turmaLabel[a.turma] || a.turma : a.horario || "-";

    return `
<tr>
<td class="td-name">${a.nome}<small>${a.tel}</small></td>
<td>${a.nascimento ? fmtDate(a.nascimento) : "-"}<br><small>${a.nascimento ? calcularIdade(a.nascimento) + " anos" : ""}</small></td>
<td>${a.modalidade === "musculacao" ? "Musculação" : "Funcional"}</td>
<td>R$ ${Number(a.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
<td>${horario}</td>
<td style="color:${vencColor}">${vencLabel}</td>
<td>${statusBadge[calcularStatusAluno(a)]}</td>
<td>
  <button class="icon-btn" onclick="abrirModalPagamento(${idx})"><i class="bi bi-cash"></i></button>
  ${(() => {
      const hoje = new Date().toISOString().slice(0, 10);
      const ehAniversario = diasParaAniversario(a.nascimento) === 0 && a.aniversarioEnviadoEm !== hoje;
      if (a.bemVindoEnviado === false)
        return `<button class="icon-btn" onclick="openWhatsAppBoasVindas('${a.tel}','${a.nome}','${a.id}')" style="color:#22c55e;border-color:#22c55e33;background:#22c55e11" title="Enviar boas-vindas 🎉"><i class="bi bi-whatsapp"></i></button>`;
      if (ehAniversario)
        return `<button class="icon-btn" onclick="openWhatsAppAniversario('${a.tel}','${a.nome}','${a.id}')" style="color:#f5a623;border-color:#f5a62333;background:#f5a62311" title="Feliz Aniversário 🎂"><i class="bi bi-whatsapp"></i></button>`;
      return `<button class="icon-btn" onclick="openWhatsApp('${a.tel}','${a.nome}','${a.vencimento}')" title="Cobrança"><i class="bi bi-whatsapp"></i></button>`;
    })()
  }
  <button class="icon-btn" onclick="editAluno(${idx})"><i class="bi bi-pencil-square"></i></button>
  <button class="icon-btn" onclick="deleteAluno(${idx})"><i class="bi bi-trash"></i></button>
</td>
</tr>`;
  }).join("");
}

export function renderAlunosFiltrados(lista) {
  document.getElementById("alunos-tbody").innerHTML = lista.map((a) => {
    const idx = alunos.indexOf(a);
    const d = diasAteVencer(a.vencimento);
    const vencColor = d < 0 ? "var(--danger)" : d <= 3 ? "var(--gold)" : "var(--muted)";
    const horLabel = a.modalidade === "funcional" ? turmaLabel[a.turma] || a.horario : a.horario;

    return `<tr>
      <td class="td-name">${a.nome}<small>${a.tel}</small></td>
      <td>${horLabel}</td>
      <td style="color:${vencColor}">${fmtDate(a.vencimento)}</td>
      <td>${fmtDate(a.avaliacao)}</td>
      <td>${statusBadge[calcularStatusAluno(a)]}</td>
      <td><button class="icon-btn" onclick="editAluno(${idx})"><i class="bi bi-pencil-square"></i></button></td>
    </tr>`;
  }).join("");
}

export function openModal(idx = null) {
  setEditingId(idx);
  document.getElementById("modal-title").textContent = idx !== null ? "Editar Aluno" : "Novo Aluno";

  if (idx !== null) {
    const a = alunos[idx];
    document.getElementById("f-nome").value = a.nome;
    document.getElementById("f-tel").value = a.tel;
    document.getElementById("f-nascimento").value = a.nascimento || "";
    document.getElementById("f-modal").value = a.modalidade;
    document.getElementById("f-valor").value =
      "R$ " + Number(a.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("f-turma").value = a.turma || "";
    document.getElementById("f-horario").value = a.horario || "";
    document.getElementById("f-venc").value = a.vencimento;
    document.getElementById("f-aval").value = a.avaliacao;
    document.getElementById("f-status").value = a.status;
    onModalChange();
  } else {
    document.getElementById("f-nome").value = "";
    document.getElementById("f-tel").value = "";
    document.getElementById("f-nascimento").value = "";
    document.getElementById("f-modal").value = "";
    document.getElementById("f-valor").value = "";
    document.getElementById("f-horario").value = "15:00";
    document.getElementById("f-venc").value = daysFromNow(30);
    document.getElementById("f-aval").value = daysFromNow(90);
    document.getElementById("f-status").value = "Ativo";
    document.getElementById("f-turma-group").style.display = "none";
  }

  document.getElementById("modal-backdrop").classList.add("open");
}

export function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

export function onModalChange() {
  const modalidade = document.getElementById("f-modal").value;
  const turmaGroup = document.getElementById("f-turma-group");
  const horarioGroup = document.getElementById("f-horario-group");
  const horarioSelect = document.getElementById("f-horario");
  horarioSelect.innerHTML = "";

  if (modalidade === "funcional") {
    turmaGroup.style.display = "flex";
    horarioGroup.style.display = "none";
  } else if (modalidade === "musculacao") {
    turmaGroup.style.display = "none";
    horarioGroup.style.display = "flex";
    for (let h = 6; h <= 22; h++) {
      const hora = `${String(h).padStart(2, "0")}:00`;
      horarioSelect.innerHTML += `<option value="${hora}">${hora}</option>`;
    }
  } else {
    turmaGroup.style.display = "none";
    horarioGroup.style.display = "none";
  }
}

export function editAluno(idx) {
  openModal(idx);
}

export async function deleteAluno(idx) {
  const aluno = alunos[idx];
  if (!confirm(`Remover ${aluno.nome}?`)) return;

  showLoading("Removendo aluno...");
  try {
    const snap = await getDocs(
      query(collection(db, "pagamentos"), where("alunoId", "==", aluno.id)),
    );
    for (const d of snap.docs) await deleteDoc(doc(db, "pagamentos", d.id));
    await deleteDoc(doc(db, "alunos", aluno.id));
    showToast("Aluno removido");
    await window.carregarAlunos();
  } finally {
    hideLoading();
  }
}

export async function saveAluno() {
  const nome = document.getElementById("f-nome").value.trim();
  if (!nome) { showToast("Informe o nome do aluno.", "error"); return; }

  const telRaw = document.getElementById("f-tel").value.trim();
  const numeroLimpo = telRaw.replace(/\D/g, "");
  if (numeroLimpo.length !== 11) { showToast("Telefone inválido. Use DDD + 9 dígitos.", "error"); return; }
  const telFormatado = numeroLimpo.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");

  const nascimento = document.getElementById("f-nascimento").value;
  if (!nascimento) { showToast("Informe a data de nascimento.", "error"); return; }

  const modalidade = document.getElementById("f-modal").value;
  if (!modalidade) { showToast("Selecione a modalidade.", "error"); return; }

  const valorStr = document.getElementById("f-valor").value;
  if (!valorStr) { showToast("Informe o valor da mensalidade.", "error"); return; }
  const valor = Number(valorStr.replace("R$", "").replace(/\./g, "").replace(",", "."));
  if (!valor || valor <= 0) { showToast("Valor da mensalidade inválido.", "error"); return; }

  const turma = document.getElementById("f-turma").value;
  const horario = document.getElementById("f-horario").value;

  const totalNaTurma = alunos.filter((a) => {
    if (editingId !== null && a.id === alunos[editingId].id) return false;
    if (modalidade === "funcional") return a.modalidade === "funcional" && a.turma === turma;
    if (modalidade === "musculacao") return a.modalidade === "musculacao" && a.horario === horario;
    return false;
  }).length;
  if (totalNaTurma >= 50) { showToast("Esta turma/horário já atingiu o limite de 50 alunos.", "error"); return; }

  const snap = await getDocs(collection(db, "alunos"));
  const telefoneDuplicado = snap.docs.find((docSnap) => {
    if (editingId !== null && docSnap.id === alunos[editingId].id) return false;
    return docSnap.data().tel.replace(/\D/g, "") === numeroLimpo;
  });
  if (telefoneDuplicado) { showToast("Já existe um aluno com esse telefone.", "error"); return; }

  const aluno = {
    nome, tel: telFormatado, modalidade, valor, nascimento,
    turma: modalidade === "funcional" ? turma : null,
    horario: modalidade === "musculacao" ? horario : null,
    vencimento: document.getElementById("f-venc").value,
    avaliacao: document.getElementById("f-aval").value,
    responsavel: "Rodrigo Pedroso",
    status: document.getElementById("f-status").value,
    statusAval: editingId !== null ? alunos[editingId].statusAval : "Pendente",
    bemVindoEnviado: editingId !== null ? (alunos[editingId].bemVindoEnviado ?? true) : false,
    dataEntrada: new Date().toISOString().slice(0, 10),
  };

  try {
    showLoading(editingId !== null ? "Salvando alterações..." : "Cadastrando aluno...");
    if (editingId !== null) {
      await updateDoc(doc(db, "alunos", alunos[editingId].id), aluno);
    } else {
      await addDoc(collection(db, "alunos"), aluno);
    }
    closeModal();
    await window.carregarAlunos();
    showToast("Aluno salvo com sucesso!", "success");
  } catch (error) {
    console.error("Erro ao salvar:", error);
    showToast("Erro ao salvar aluno.", "error");
  } finally {
    hideLoading();
  }
}

// Máscara de telefone
const telInput = document.getElementById("f-tel");
if (telInput) {
  telInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 6) value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else value = value.replace(/^(\d*)/, "($1");
    e.target.value = value;
  });
}

// Máscara de valor de mensalidade
const valorInput = document.getElementById("f-valor");
if (valorInput) {
  valorInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) { e.target.value = ""; return; }
    value = (parseInt(value) / 100).toFixed(2);
    value = value.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    e.target.value = "R$ " + value;
  });
}
