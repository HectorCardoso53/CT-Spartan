import { db, logout } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== STATE =====
let alunos = [];
let editingId = null;
let pagamentoAluno = null;
let pagamentos = [];

async function carregarPagamentos() {
  const snap = await getDocs(collection(db, "pagamentos"));

  pagamentos = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  document.getElementById("filter-mes").value = new Date()
    .toISOString()
    .slice(0, 7);

  renderPagamentos();
}

function renderPagamentos() {
  const q =
    document.getElementById("search-pagamento")?.value?.toLowerCase() || "";

  const mesFiltro = document.getElementById("filter-mes")?.value || "";

  const modalFiltro =
    document.getElementById("filter-modalidade-pag")?.value || "";

  const list = pagamentos.filter((p) => {
    if (alunos.length > 0) {
      const alunoExiste = alunos.some((a) => a.id === p.alunoId);
      if (!alunoExiste) return false;
    }

    // filtro nome
    if (q && !p.nome.toLowerCase().includes(q)) return false;

    // filtro mês
    if (mesFiltro && p.mes !== mesFiltro) return false;

    // filtro modalidade
    if (modalFiltro && p.modalidade !== modalFiltro) return false;

    return true;
  });

  // ===== FATURAMENTO =====

  let total = 0;

  list.forEach((p) => {
    total += Number(p.valor);
  });

  document.getElementById("fat-mes").textContent =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  // ===== TABELA =====

  document.getElementById("pagamentos-tbody").innerHTML = list
    .map(
      (p) => `

<tr>

<td class="td-name">
${p.nome}
</td>

<td>
${p.modalidade === "funcional" ? "Funcional" : "Musculação"}
</td>

<td>
${p.mes}
</td>

<td>
R$ ${p.valor}
</td>

<td>
${fmtDate(p.data)}
</td>

</tr>

`,
    )
    .join("");

  document.getElementById("pagamentos-empty").style.display = list.length
    ? "none"
    : "block";
}

const valorPagamento = document.getElementById("p-valor");

if (valorPagamento) {
  valorPagamento.addEventListener("input", function (e) {

    let value = e.target.value.replace(/\D/g, "");

    if (!value) {
      e.target.value = "";
      return;
    }

    value = (parseInt(value) / 100).toFixed(2);

    value = value
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    e.target.value = "R$ " + value;
  });
}

async function carregarAlunos() {
  const snap = await getDocs(collection(db, "alunos"));

  alunos = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // ===== LISTENERS FILTROS =====
  document
    .getElementById("filter-modal")
    ?.addEventListener("change", renderAlunos);

  document
    .getElementById("filter-horario")
    ?.addEventListener("change", renderAlunos);

  document
    .getElementById("search-aluno")
    ?.addEventListener("input", renderAlunos);

  document
    .getElementById("filter-aval-status")
    ?.addEventListener("change", renderAvaliacoes);

  renderDashboard();
  populateHorarioFilter();
  renderAlunos();
  renderAvaliacoes();
  carregarPagamentos();
}

function daysFromNow(d) {
  const r = new Date();
  r.setDate(r.getDate() + d);
  return r.toISOString().slice(0, 10);
}

// ===== NAVIGATION =====
function navigate(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll(".nav-item").forEach((n) => {
    if (
      n.textContent
        .toLowerCase()
        .includes(page === "dashboard" ? "dash" : page.slice(0, 4))
    )
      n.classList.add("active");
  });
  const titles = {
    dashboard: "Dashboard",
    alunos: "Alunos",
    turmas: "Turmas & Horários",
    avaliacoes: "Avaliações Físicas",
    alertas: "Alertas",
  };
  document.getElementById("page-title").textContent = titles[page] || page;
  if (page === "dashboard") renderDashboard();
  if (page === "alunos") {
    renderAlunos();
  }
  if (page === "turmas") renderTurmas();
  if (page === "avaliacoes") renderAvaliacoes();
  if (page === "alertas") renderAlertas();
  if (page === "pagamentos") carregarPagamentos();

  // 🔥 FECHA MENU MOBILE
  const sidebar = document.querySelector(".sidebar");

  if (window.innerWidth <= 600) {
    sidebar.classList.remove("open");
  }
}

// ===== UTILS =====
function diasAteVencer(dateStr) {
  if (!dateStr) return 0;

  const [y, m, d] = dateStr.split("-").map(Number);

  const data = new Date(y, m - 1, d); // cria data LOCAL
  const hojeLocal = new Date();
  hojeLocal.setHours(0, 0, 0, 0);

  const diff = data - hojeLocal;

  return Math.floor(diff / 86400000);
}

function fmtDate(d) {
  if (!d) return "–";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}
function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

const telInput = document.getElementById("f-tel");

if (telInput) {
  telInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      value = value.replace(/^(\d*)/, "($1");
    }

    e.target.value = value;
  });
}

const statusBadge = {
  Ativo: `
    <span class="badge badge-green">
      <i class="bi bi-check-circle-fill" style="margin-right:4px;"></i>
      Ativo
    </span>
  `,

  Atrasado: `
    <span class="badge badge-red">
      <i class="bi bi-exclamation-triangle-fill" style="margin-right:4px;"></i>
      Atrasado
    </span>
  `,

  Inativo: `
    <span class="badge" style="background:rgba(100,100,120,0.2);color:#7070a0">
      <i class="bi bi-x-circle-fill" style="margin-right:4px;"></i>
      Inativo
    </span>
  `,
};
const turmaLabel = {
  "manha-06": "Manhã 06:00",
  "noite-19": "Noite 19:00",
  "noite-20": "Noite 20:00",
};
const avatarColors = [
  "#e8342a",
  "#3b82f6",
  "#ff6b35",
  "#22c55e",
  "#a855f7",
  "#f5a623",
];

// ===== DASHBOARD =====
function renderDashboard() {
  const ativos = alunos.filter((a) => a.status === "Ativo").length;
  const musc = alunos.filter((a) => a.modalidade === "musculacao").length;
  const func = alunos.filter((a) => a.modalidade === "funcional").length;

  const venc7 = alunos.filter((a) => {
    const d = diasAteVencer(a.vencimento);
    return d >= 0 && d <= 7;
  }).length;

  document.getElementById("stat-ativos").textContent = ativos;
  document.getElementById("stat-musc").textContent = musc;
  document.getElementById("stat-func").textContent = func;
  document.getElementById("stat-venc").textContent = venc7;

  document.getElementById("leg-musc").textContent = musc;
  document.getElementById("leg-func").textContent = func;

  document.getElementById("leg-atr").textContent = alunos.filter(
    (a) => a.status === "Atrasado",
  ).length;

  // ===== DONUT =====

  const total = alunos.length || 1;
  const circ = 2 * Math.PI * 45;

  const muscDash = (musc / total) * circ;
  const funcDash = (func / total) * circ;

  document
    .getElementById("donut-musc")
    .setAttribute("stroke-dasharray", `${muscDash} ${circ - muscDash}`);

  document
    .getElementById("donut-func")
    .setAttribute("stroke-dasharray", `${funcDash} ${circ - funcDash}`);

  document
    .getElementById("donut-func")
    .setAttribute("stroke-dashoffset", -muscDash + circ * 0.25);

  // ===== ALERTAS DE VENCIMENTO =====

  const alertasEl = document.getElementById("dash-alertas");

  const alertasList = alunos
    .filter((a) => {
      const d = diasAteVencer(a.vencimento);
      return d <= 3 && d >= -30;
    })
    .slice(0, 5);

  if (alertasList.length === 0) {
    alertasEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <i class="bi bi-check-circle-fill text-success"></i>
        </div>
        <div>Nenhum alerta!</div>
      </div>
    `;
  } else {
    alertasEl.innerHTML = alertasList
      .map((a, i) => {
        const d = diasAteVencer(a.vencimento);

        const msg =
          d < 0
            ? `Vencido há ${Math.abs(d)} dia(s)`
            : d === 0
              ? "Vence HOJE"
              : `Vence em ${d} dia(s)`;

        const color = d < 0 ? "#ef4444" : d === 0 ? "#f5a623" : "#ff6b35";

        return `
        <div class="alert-item">
          <div class="alert-avatar"
            style="background:${avatarColors[i % 6]}22;color:${avatarColors[i % 6]}">
            ${iniciais(a.nome)}
          </div>

          <div class="alert-info">
            <strong>${a.nome}</strong>
            <small>${msg}</small>
          </div>

          <span class="badge"
            style="background:${color}22;color:${color};font-size:0.75rem">
            ${fmtDate(a.vencimento)}
          </span>
        </div>`;
      })
      .join("");
  }

  // ===== AVALIAÇÕES =====

  const avalsEl = document.getElementById("dash-avals");

  const avalsList = alunos
    .filter((a) => {
      const d = diasAteVencer(a.avaliacao);
      return d <= 5 && d >= 0 && a.statusAval === "Pendente";
    })
    .slice(0, 5);

  if (avalsList.length === 0) {
    avalsEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <i class="bi bi-clipboard-check-fill text-success"></i>
        </div>
        <div>Sem avaliações próximas</div>
      </div>
    `;
  } else {
    avalsEl.innerHTML = avalsList
      .map((a, i) => {
        const d = diasAteVencer(a.avaliacao);

        return `
        <div class="aval-row">

          <div class="aval-icon" style="background:${avatarColors[i % 6]}22">
            <i class="bi bi-person-fill"></i>
          </div>

          <div style="flex:1">
            <strong style="font-size:0.88rem">
              ${a.nome}
            </strong>

            <br>

            <small style="color:var(--muted)">
              ${d === 0 ? "Hoje" : `Em ${d} dia(s)`} • ${a.responsavel}
            </small>
          </div>

          <span class="badge badge-gold">
            Pendente
          </span>

        </div>
        `;
      })
      .join("");
  }

  // ===== BAR CHART MUSCULAÇÃO =====

  const horarios = [
    ...new Set(
      alunos.filter((a) => a.modalidade === "musculacao").map((a) => a.horario),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const chart = document.getElementById("bar-chart-musc");

  if (horarios.length === 0) {
    chart.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <i class="bi bi-barbell"></i>
        </div>
        <div>Nenhum aluno na musculação</div>
      </div>
    `;
    return;
  }

  const counts = horarios.map(
    (h) =>
      alunos.filter((a) => a.modalidade === "musculacao" && a.horario === h)
        .length,
  );

  const maxC = Math.max(...counts, 1);

  chart.innerHTML = horarios
    .map(
      (h, i) => `
      <div class="bar-group">

        <div class="bar-val">${counts[i]}</div>

        <div class="bar"
          style="height:${(counts[i] / maxC) * 80}px"
          title="${h}: ${counts[i]} alunos">
        </div>

        <div class="bar-label">
          ${h.replace(":00", "h")}
        </div>

      </div>
      `,
    )
    .join("");
}

// ===== ALUNOS =====
function populateHorarioFilter() {
  const sel = document.getElementById("filter-horario");
  if (!sel) return;

  const horariosMusc = alunos
    .filter((a) => a.modalidade === "musculacao")
    .map((a) => a.horario);

  const turmasFunc = alunos
    .filter((a) => a.modalidade === "funcional")
    .map((a) => a.turma);

  const lista = [...new Set([...horariosMusc, ...turmasFunc])].sort();

  sel.innerHTML =
    '<option value="">Todos horários</option>' +
    lista
      .map((v) => {
        if (turmaLabel[v]) {
          return `<option value="${v}">${turmaLabel[v]}</option>`;
        }

        return `<option value="${v}">${v}</option>`;
      })
      .join("");
}

function calcularStatusAluno(a) {
  const dias = diasAteVencer(a.vencimento);

  if (a.status === "Inativo") return "Inativo";

  if (dias < 0) return "Atrasado";

  return "Ativo";
}

function abrirModalPagamento(idx) {
  const aluno = alunos[idx];

  pagamentoAluno = aluno;

  document.getElementById("p-nome").value = aluno.nome;

  document.getElementById("p-modalidade").value =
    aluno.modalidade === "funcional" ? "Funcional" : "Musculação";

  const valor = aluno.valor;

  document.getElementById("p-valor").value =
  "R$ " + Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  document.getElementById("p-data").value = new Date()
    .toISOString()
    .slice(0, 10);

  document.getElementById("p-mes").value = new Date().toISOString().slice(0, 7);

  document.getElementById("modal-pagamento").classList.add("open");
}
function fecharModalPagamento() {
  document.getElementById("modal-pagamento").classList.remove("open");

  pagamentoAluno = null;
}

async function confirmarPagamento() {
  if (!pagamentoAluno) return;

  const mes = document.getElementById("p-mes").value;
  const data = document.getElementById("p-data").value;
  const valorStr = document.getElementById("p-valor").value;

  if (!mes) {
    showToast("Selecione o mês", "error");
    return;
  }

  if (!valorStr) {
    showToast("Informe o valor do pagamento", "error");
    return;
  }

  // 🔥 converte "R$ 180,00" → 180
  const valor = Number(
    valorStr
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
  );

  if (!valor || valor <= 0) {
    showToast("Valor inválido", "error");
    return;
  }

  // 🔴 VERIFICA DUPLICADO
  const q = query(
    collection(db, "pagamentos"),
    where("alunoId", "==", pagamentoAluno.id),
    where("mes", "==", mes)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    showToast("Pagamento deste mês já registrado", "error");
    return;
  }

  // ✅ SALVA PAGAMENTO
  await addDoc(collection(db, "pagamentos"), {
    alunoId: pagamentoAluno.id,
    nome: pagamentoAluno.nome,
    modalidade: pagamentoAluno.modalidade,

    turma: pagamentoAluno.turma || null,
    horario: pagamentoAluno.horario || null,

    mes: mes,
    valor: valor,
    data: data,
  });

  // 🔥 calcula próximo vencimento
  const prox = new Date(pagamentoAluno.vencimento);
  prox.setMonth(prox.getMonth() + 1);

  await updateDoc(doc(db, "alunos", pagamentoAluno.id), {
    vencimento: prox.toISOString().slice(0, 10),
    status: "Ativo",
  });

  fecharModalPagamento();

  showToast("Pagamento registrado");

  carregarAlunos();
}

async function deleteAluno(idx) {
  const aluno = alunos[idx];

  if (!confirm(`Remover ${aluno.nome}?`)) return;

  // 🔴 BUSCA PAGAMENTOS DO ALUNO
  const q = query(
    collection(db, "pagamentos"),
    where("alunoId", "==", aluno.id),
  );

  const snap = await getDocs(q);

  for (const d of snap.docs) {
    await deleteDoc(doc(db, "pagamentos", d.id));
  }

  // 🔴 DELETA O ALUNO
  await deleteDoc(doc(db, "alunos", aluno.id));

  showToast("Aluno removido");

  carregarAlunos();
}

// ===== TURMAS =====
function renderTurmas() {
  const funcTurmas = [
    { id: "manha-06", label: "Turma 1 – Manhã", time: "06:00 – 07:00" },
    { id: "noite-19", label: "Turma 2 – Noite", time: "19:00 – 20:00" },
    { id: "noite-20", label: "Turma 3 – Noite", time: "20:00 – 21:00" },
  ];

  // ===== FUNCIONAL =====
  document.getElementById("turma-funcional").innerHTML = funcTurmas
    .map((t) => {
      const count = alunos.filter(
        (a) => a.modalidade === "funcional" && a.turma === t.id,
      ).length;

      return `
      <div class="turma-card"
           style="cursor:pointer"
           onclick="abrirTurma('funcional','${t.id}')">

        <div class="turma-header">
          <div>
            <div class="turma-name">${t.label}</div>
            <div class="turma-time">${t.time}</div>
          </div>
          <span class="badge badge-gold">
            <i class="bi bi-lightning-charge-fill"></i>
          </span>
        </div>

        <div class="turma-count">
          ${count} <small>alunos</small>
        </div>

        <div style="margin-top:12px">
          <div class="progress-bar">
            <div class="progress-fill"
              style="width:${Math.min((count / 20) * 100, 100)}%;
                     background:var(--accent2)">
            </div>
          </div>
          <small style="color:var(--muted)">Capacidade: 20</small>
        </div>

      </div>`;
    })
    .join("");

  // ===== MUSCULAÇÃO =====
  const muscHorarios = [
    ...new Set(
      alunos.filter((a) => a.modalidade === "musculacao").map((a) => a.horario),
    ),
  ].sort((a, b) => a.localeCompare(b));

  document.getElementById("turma-musculacao").innerHTML =
    muscHorarios.length === 0
      ? `
        <div class="empty">
          <div class="empty-icon">
            <i class="bi bi-barbell"></i>
          </div>
          <div>Nenhum aluno cadastrado na musculação</div>
        </div>
      `
      : muscHorarios
          .map((h) => {
            const count = alunos.filter(
              (a) => a.modalidade === "musculacao" && a.horario === h,
            ).length;

            return `
            <div class="turma-card"
                 style="cursor:pointer"
                 onclick="abrirTurma('musculacao','${h}')">

              <div class="turma-header">
                <div>
                  <div class="turma-name">Musculação</div>
                  <div class="turma-time">${h}</div>
                </div>

                <span class="badge badge-blue">
                  <i class="bi bi-barbell"></i>
                </span>
              </div>

              <div class="turma-count">
                ${count} <small>alunos</small>
              </div>

              <div style="margin-top:12px">
                <div class="progress-bar">
                  <div class="progress-fill"
                    style="width:${Math.min((count / 30) * 100, 100)}%">
                  </div>
                </div>
                <small style="color:var(--muted)">Fluxo: 30 max</small>
              </div>

            </div>`;
          })
          .join("");
}

// ===== AVALIACOES =====
function renderAvaliacoes() {
  const q = document.getElementById("search-aval")?.value?.toLowerCase() || "";

  const statusFiltro =
    document.getElementById("filter-aval-status")?.value || "";

  let list = alunos.filter((a) => {
    if (q && !a.nome.toLowerCase().includes(q)) return false;

    if (statusFiltro && a.statusAval !== statusFiltro) return false;

    return true;
  });

  const tbody = document.getElementById("aval-tbody");

  document.getElementById("aval-empty").style.display = list.length
    ? "none"
    : "block";

  tbody.innerHTML = list
    .map((a) => {
      const idx = alunos.indexOf(a);

      const dias = diasAteVencer(a.avaliacao);

      let alert = false;
      let cor = "var(--text)";

      if (dias <= 5 && dias >= 0 && a.statusAval === "Pendente") {
        alert = true;
        cor = "var(--gold)";
      }

      if (dias < 0 && a.statusAval === "Pendente") {
        cor = "var(--danger)";
      }

      return `

<tr style="${alert ? "background:rgba(245,166,35,0.05)" : ""}">

<td class="td-name">
${a.nome}
<small>${a.tel}</small>
</td>

<td>
${a.modalidade === "musculacao" ? "Musculação" : "Funcional"}
</td>

<td style="color:${cor}">
${fmtDate(a.avaliacao)}

${alert ? '<i class="bi bi-exclamation-triangle-fill" style="margin-left:6px;color:var(--gold)"></i>' : ""}
</td>

<td>
${a.responsavel}
</td>

<td>
${
  a.statusAval === "Realizada"
    ? '<span class="badge badge-green">Realizada</span>'
    : '<span class="badge badge-gold">Pendente</span>'
}
</td>

<td>

${
  a.statusAval === "Pendente"
    ? `

<button class="icon-btn"
onclick="marcarRealizada(${idx})">
<i class="bi bi-check2-circle"></i>
</button>

<button class="icon-btn"
onclick="openWhatsAppAvaliacao('${a.tel}','${a.nome}','${a.avaliacao}')">
<i class="bi bi-whatsapp"></i>
</button>

`
    : ""
}

</td>

</tr>

`;
    })
    .join("");
}
function marcarRealizada(idx) {
  alunos[idx].statusAval = "Realizada";
  renderAvaliacoes();
  showToast("✅ Avaliação marcada como realizada");
}

function abrirTurma(tipo, valor) {
  navigate("alunos");

  // Limpa filtros
  document.getElementById("filter-modal").value = tipo;
  document.getElementById("search-aluno").value = "";

  if (tipo === "funcional") {
    const fh = document.getElementById("filter-horario");
    if (fh) fh.value = "";

    const filtrados = alunos.filter(
      (a) => a.modalidade === "funcional" && a.turma === valor,
    );

    renderAlunosFiltrados(filtrados);
  } else {
    document.getElementById("filter-horario").value = valor;
    renderAlunos();
  }
}

function renderAlunosFiltrados(lista) {
  const tbody = document.getElementById("alunos-tbody");
  tbody.innerHTML = lista
    .map((a) => {
      const idx = alunos.indexOf(a);
      const d = diasAteVencer(a.vencimento);
      const vencColor =
        d < 0 ? "var(--danger)" : d <= 3 ? "var(--gold)" : "var(--muted)";
      const horLabel =
        a.modalidade === "funcional"
          ? `${turmaLabel[a.turma] || a.horario}`
          : a.horario;

      return `<tr>
        <td class="td-name">
          ${a.nome}
          <small>${a.tel}</small>
        </td>
        <td>${horLabel}</td>
        <td style="color:${vencColor}">
          ${fmtDate(a.vencimento)}
        </td>
        <td>${fmtDate(a.avaliacao)}</td>
        <td>${statusBadge[calcularStatusAluno(a)]}</td>
        <td>
          <button class="icon-btn" onclick="editAluno(${idx})">
            <i class="bi bi-pencil-square"></i>
          </button>
        </td>
      </tr>`;
    })
    .join("");
}

function toggleMenu(){
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("open");
}

window.toggleMenu = toggleMenu;

document.addEventListener("click", function(e){

  const sidebar = document.querySelector(".sidebar");
  const toggle = document.querySelector(".menu-toggle");

  if(!sidebar.contains(e.target) && !toggle.contains(e.target)){
    sidebar.classList.remove("open");
  }

});


// ===== ALERTAS =====
function renderAlertas() {
  // ===============================
  // PLANOS VENCIDOS
  // ===============================
  const venc = alunos.filter((a) => diasAteVencer(a.vencimento) < 0);

  document.getElementById("alertas-vencidos").innerHTML = venc.length
    ? venc
        .map((a) => {
          const d = Math.abs(diasAteVencer(a.vencimento));

          return `<div class="alert-item">
            <div class="alert-avatar" style="background:#ef444420;color:#ef4444">
              ${iniciais(a.nome)}
            </div>

            <div class="alert-info">
              <strong>${a.nome}</strong>
              <small>
                ${
                  a.modalidade === "musculacao"
                    ? `<i class="bi bi-barbell"></i> Musculação`
                    : `<i class="bi bi-lightning-charge-fill"></i> Funcional`
                }
                · ${a.horario}
              </small>
            </div>

            <div style="text-align:right">
              <div style="color:var(--danger);font-size:0.85rem">
                <i class="bi bi-exclamation-triangle-fill"></i>
                Vencido há ${d} dia(s)
              </div>
              <small style="color:var(--muted)">
                <i class="bi bi-calendar-event"></i>
                ${fmtDate(a.vencimento)}
              </small>
            </div>

            
          </div>`;
        })
        .join("")
    : `
      <div class="empty">
        <div class="empty-icon">
          <i class="bi bi-check-circle-fill" style="color:var(--green);"></i>
        </div>
        <div>Nenhum plano vencido</div>
      </div>
    `;

  // ===============================
  // PRÓXIMOS 7 DIAS
  // ===============================
  const prox = alunos.filter((a) => {
    const d = diasAteVencer(a.vencimento);
    return d >= 0 && d <= 7;
  });

  document.getElementById("alertas-proximos").innerHTML = prox.length
    ? prox
        .map((a) => {
          const d = diasAteVencer(a.vencimento);

          return `<div class="alert-item">
          <div class="alert-avatar" style="background:#f5a62320;color:#f5a623">
            ${iniciais(a.nome)}
          </div>

          <div class="alert-info">
            <strong>${a.nome}</strong>
            <small>
              ${
                a.modalidade === "musculacao"
                  ? `<i class="bi bi-barbell"></i> Musculação`
                  : `<i class="bi bi-lightning-charge-fill"></i> Funcional`
              }
              · ${a.horario}
            </small>
          </div>

          <div style="text-align:right">
            <div style="color:var(--gold);font-size:0.85rem">
              <i class="bi bi-hourglass-split"></i>
              ${d === 0 ? "Vence HOJE" : `Vence em ${d} dia(s)`}
            </div>
            <small style="color:var(--muted)">
              <i class="bi bi-calendar-event"></i>
              ${fmtDate(a.vencimento)}
            </small>
          </div>

        </div>`;
        })
        .join("")
    : `
    <div class="empty">
      <div class="empty-icon">
        <i class="bi bi-emoji-smile"></i>
      </div>
      <div>Nenhum vencendo em breve</div>
    </div>
  `;

  // ===============================
  // AVALIAÇÕES PENDENTES
  // ===============================
  const avals = alunos.filter(
    (a) => a.statusAval === "Pendente" && diasAteVencer(a.avaliacao) <= 5,
  );

  document.getElementById("alertas-avals").innerHTML = avals.length
    ? avals
        .map((a) => {
          const d = diasAteVencer(a.avaliacao);

          return `<div class="alert-item">
            <div class="alert-avatar" style="background:#3b82f620;color:#3b82f6">
              ${iniciais(a.nome)}
            </div>

            <div class="alert-info">
              <strong>${a.nome}</strong>
              <small>
                <i class="bi bi-person-badge"></i>
                Resp: ${a.responsavel}
              </small>
            </div>

            <div style="text-align:right">
              <div style="color:var(--blue);font-size:0.85rem">
                <i class="bi bi-clipboard2-pulse-fill"></i>
                ${
                  d < 0
                    ? `Atrasada ${Math.abs(d)} dia(s)`
                    : d === 0
                      ? "Hoje"
                      : `Em ${d} dia(s)`
                }
              </div>
              <small style="color:var(--muted)">
                <i class="bi bi-calendar-event"></i>
                ${fmtDate(a.avaliacao)}
              </small>
            </div>
          </div>`;
        })
        .join("")
    : `
      <div class="empty">
        <div class="empty-icon">
          <i class="bi bi-clipboard-check-fill"></i>
        </div>
        <div>Sem avaliações pendentes próximas</div>
      </div>
    `;
}

// ===== MODAL =====
// ===== MODAL =====
function openModal(idx = null) {
  editingId = idx;

  document.getElementById("modal-title").textContent =
    idx !== null ? "Editar Aluno" : "Novo Aluno";

  if (idx !== null) {
    const a = alunos[idx];

    document.getElementById("f-nome").value = a.nome;
    document.getElementById("f-tel").value = a.tel;
    document.getElementById("f-modal").value = a.modalidade;

    // 🔥 VALOR DA MENSALIDADE
    document.getElementById("f-valor").value =
      "R$ " +
      Number(a.valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      });

    document.getElementById("f-turma").value = a.turma || "";
    document.getElementById("f-horario").value = a.horario || "";
    document.getElementById("f-venc").value = a.vencimento;
    document.getElementById("f-aval").value = a.avaliacao;
    document.getElementById("f-status").value = a.status;

    onModalChange();
  } else {
    document.getElementById("f-nome").value = "";
    document.getElementById("f-tel").value = "";
    document.getElementById("f-modal").value = "";

    // 🔥 LIMPA VALOR
    document.getElementById("f-valor").value = "";

    document.getElementById("f-horario").value = "15:00";
    document.getElementById("f-venc").value = daysFromNow(30);
    document.getElementById("f-aval").value = daysFromNow(90);
    document.getElementById("f-status").value = "Ativo";

    document.getElementById("f-turma-group").style.display = "none";
  }

  document.getElementById("modal-backdrop").classList.add("open");
}

const valorInput = document.getElementById("f-valor");

if (valorInput) {
  valorInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");

    if (!value) {
      e.target.value = "";
      return;
    }

    value = (parseInt(value) / 100).toFixed(2);

    value = value.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    e.target.value = "R$ " + value;
  });
}

function openWhatsApp(tel, nome, vencimento) {
  if (!tel) {
    alert("Aluno sem telefone cadastrado.");
    return;
  }

  // Remove tudo que não for número
  let numero = tel.replace(/\D/g, "");

  // Se começar com 0, remove
  if (numero.startsWith("0")) {
    numero = numero.substring(1);
  }

  // Se NÃO começar com 55, adiciona
  if (!numero.startsWith("55")) {
    numero = "55" + numero;
  }

  const mensagem = `Olá ${nome}! 👋

Seu plano vence em ${fmtDate(vencimento)}.

Qualquer dúvida estamos à disposição 💪🔥`;

  // 🔥 IMPORTANTE: usar api.whatsapp.com
  const url = `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}

function openWhatsAppAvaliacao(tel, nome, avaliacao) {
  if (!tel) {
    showToast("Aluno sem telefone cadastrado.", "error");
    return;
  }

  let numero = tel.replace(/\D/g, "");

  if (!numero.startsWith("55")) {
    numero = "55" + numero;
  }

  const mensagem = `Olá ${nome}! 👋

Sua avaliação física está agendada para ${fmtDate(avaliacao)}.

Contamos com você 💪🔥
CT Spartan`;

  const url = `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}

window.openWhatsAppAvaliacao = openWhatsAppAvaliacao;

function filtrarPorTurma(tipo, valor) {
  navigate("alunos");

  // Limpa filtros primeiro
  document.getElementById("filter-modal").value = tipo;
  document.getElementById("filter-horario").value = "";
  document.getElementById("search-aluno").value = "";

  if (tipo === "funcional") {
    // filtra por turma
    alunos = alunos.map((a) => a); // mantém lista
    renderAlunos();

    // aplica filtro manual
    document.getElementById("alunos-tbody").innerHTML = alunos
      .filter((a) => a.modalidade === "funcional" && a.turma === valor)
      .map((a) => gerarLinhaAluno(a))
      .join("");
  } else if (tipo === "musculacao") {
    document.getElementById("filter-horario").value = valor;
    renderAlunos();
  }
}

function gerarLinhaAluno(a) {
  const idx = alunos.indexOf(a);
  const d = diasAteVencer(a.vencimento);
  const vencColor =
    d < 0 ? "var(--danger)" : d <= 3 ? "var(--gold)" : "var(--muted)";
  const horLabel =
    a.modalidade === "funcional"
      ? `${turmaLabel[a.turma] || a.horario}`
      : a.horario;

  return `<tr>
    <td class="td-name">
      ${a.nome}
      <small>${a.tel}</small>
    </td>
    <td>${a.modalidade}</td>
    <td>${horLabel}</td>
    <td style="color:${vencColor}">
      ${fmtDate(a.vencimento)}
    </td>
    <td>${fmtDate(a.avaliacao)}</td>
    <td>${statusBadge[a.status] || a.status}</td>
    <td>
      <button class="icon-btn" onclick="editAluno(${idx})">
        <i class="bi bi-pencil-square"></i>
      </button>
    </td>
  </tr>`;
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

function onModalChange() {
  const modalidade = document.getElementById("f-modal").value;
  const turmaGroup = document.getElementById("f-turma-group");
  const horarioGroup = document.getElementById("f-horario-group");
  const horarioSelect = document.getElementById("f-horario");

  horarioSelect.innerHTML = "";

  if (modalidade === "funcional") {
    // 🔥 MOSTRA TURMA
    turmaGroup.style.display = "flex";

    // 🔥 ESCONDE HORÁRIO
    horarioGroup.style.display = "none";
  } else if (modalidade === "musculacao") {
    // 🔥 ESCONDE TURMA
    turmaGroup.style.display = "none";

    // 🔥 MOSTRA HORÁRIO
    horarioGroup.style.display = "flex";

    // GERA horários 06h até 22h
    for (let h = 6; h <= 22; h++) {
      const hora = `${String(h).padStart(2, "0")}:00`;
      horarioSelect.innerHTML += `<option value="${hora}">${hora}</option>`;
    }
  } else {
    turmaGroup.style.display = "none";
    horarioGroup.style.display = "none";
  }
}

function editAluno(idx) {
  openModal(idx);
}

async function saveAluno() {
  const nome = document.getElementById("f-nome").value.trim();

  if (!nome) {
    showToast("Informe o nome do aluno.", "error");
    return;
  }

  const telInput = document.getElementById("f-tel").value.trim();

  const numeroLimpo = telInput.replace(/\D/g, "");

  if (numeroLimpo.length !== 11) {
    showToast("Telefone inválido. Use DDD + 9 dígitos.", "error");
    return;
  }

  const telFormatado = numeroLimpo.replace(
    /^(\d{2})(\d{5})(\d{4})$/,
    "($1) $2-$3"
  );

  const modalidade = document.getElementById("f-modal").value;

  if (!modalidade) {
    showToast("Selecione a modalidade.", "error");
    return;
  }

  // ===== VALOR DA MENSALIDADE =====
  let valorStr = document.getElementById("f-valor").value;

  if (!valorStr) {
    showToast("Informe o valor da mensalidade.", "error");
    return;
  }

  const valor = Number(
    valorStr
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
  );

  if (!valor || valor <= 0) {
    showToast("Valor da mensalidade inválido.", "error");
    return;
  }

  const snap = await getDocs(collection(db, "alunos"));

  // ===== TELEFONE DUPLICADO =====
  const telefoneDuplicado = snap.docs.find((docSnap) => {
    if (editingId !== null && docSnap.id === alunos[editingId].id) return false;

    const telBanco = docSnap.data().tel.replace(/\D/g, "");
    return telBanco === numeroLimpo;
  });

  if (telefoneDuplicado) {
    showToast("Já existe um aluno com esse telefone.", "error");
    return;
  }

  const aluno = {
    nome,
    tel: telFormatado,
    modalidade,

    valor, // 🔥 agora o valor é salvo

    turma:
      modalidade === "funcional"
        ? document.getElementById("f-turma").value
        : null,

    horario: document.getElementById("f-horario").value,

    vencimento: document.getElementById("f-venc").value,
    avaliacao: document.getElementById("f-aval").value,

    responsavel: "Rodrigo Pedroso",

    status: document.getElementById("f-status").value,

    statusAval: editingId !== null
      ? alunos[editingId].statusAval
      : "Pendente",

    dataEntrada: new Date().toISOString().slice(0, 10),
  };

  try {
    if (editingId !== null) {
      await updateDoc(doc(db, "alunos", alunos[editingId].id), aluno);
    } else {
      await addDoc(collection(db, "alunos"), aluno);
    }

    closeModal();
    carregarAlunos();
    showToast("Aluno salvo com sucesso!", "success");

  } catch (error) {
    console.error("Erro ao salvar:", error);
    showToast("Erro ao salvar aluno.", "error");
  }
}

function renderAlunos() {
  const q = document.getElementById("search-aluno").value.toLowerCase();
  const modal = document.getElementById("filter-modal").value;
  const status = document.getElementById("filter-status").value;

  const horEl = document.getElementById("filter-horario");
  const hor = horEl ? horEl.value : "";

  let list = alunos.filter((a) => {
    if (q && !a.nome.toLowerCase().includes(q)) return false;

    if (modal && a.modalidade !== modal) return false;

    if (status && calcularStatusAluno(a) !== status) return false;

    // 🔥 FILTRO INTELIGENTE
    if (hor) {
      if (a.modalidade === "musculacao" && a.horario !== hor) return false;

      if (a.modalidade === "funcional" && a.turma !== hor) return false;
    }

    return true;
  });

  const tbody = document.getElementById("alunos-tbody");

  document.getElementById("alunos-empty").style.display = list.length
    ? "none"
    : "block";

  tbody.innerHTML = list
    .map((a) => {
      const idx = alunos.indexOf(a);

      const dias = diasAteVencer(a.vencimento);

      let vencLabel = fmtDate(a.vencimento);
      let vencColor = "var(--muted)";

      if (dias < 0) {
        vencLabel = `Vencido ${Math.abs(dias)}d`;
        vencColor = "var(--danger)";
      }

      if (dias === 0) {
        vencLabel = "Vence HOJE";
        vencColor = "var(--gold)";
      }

      if (dias > 0 && dias <= 3) {
        vencLabel = `Vence em ${dias}d`;
        vencColor = "var(--gold)";
      }

      const horario =
        a.modalidade === "funcional"
          ? turmaLabel[a.turma] || a.turma
          : a.horario || "-";

      return `

<tr>

<td class="td-name">
${a.nome}
<small>${a.tel}</small>
</td>

<td>
${a.modalidade === "musculacao" ? "Musculação" : "Funcional"}
</td>
<td>
R$ ${Number(a.valor || 0).toLocaleString("pt-BR", {minimumFractionDigits:2})}
</td>

<td>
${horario}
</td>

<td style="color:${vencColor}">
${vencLabel}
</td>

<td>
${statusBadge[calcularStatusAluno(a)]}
</td>

<td>

<button class="icon-btn" onclick="abrirModalPagamento(${idx})">
<i class="bi bi-cash"></i>
</button>

<button class="icon-btn"
onclick="openWhatsApp('${a.tel}','${a.nome}','${a.vencimento}')">
<i class="bi bi-whatsapp"></i>
</button>

<button class="icon-btn" onclick="editAluno(${idx})">
<i class="bi bi-pencil-square"></i>
</button>

<button class="icon-btn" onclick="deleteAluno(${idx})">
<i class="bi bi-trash"></i>
</button>

</td>

</tr>

`;
    })
    .join("");
}

async function registrarPagamento(idx, mesSelecionado = null) {
  const aluno = alunos[idx];

  const hoje = new Date();

  const mes = mesSelecionado || hoje.toISOString().slice(0, 7);
  const data = hoje.toISOString().slice(0, 10);

  const valor = aluno.valor;

  // salva pagamento
  await addDoc(collection(db, "pagamentos"), {
    alunoId: aluno.id,
    nome: aluno.nome,
    modalidade: aluno.modalidade,

    turma: aluno.turma || null,
    horario: aluno.horario || null,

    mes: mes,
    valor: valor,
    data: data,
  });

  // calcula próximo vencimento
  const prox = new Date(aluno.vencimento);
  prox.setMonth(prox.getMonth() + 1);

  const novoVenc = prox.toISOString().slice(0, 10);

  await updateDoc(doc(db, "alunos", aluno.id), {
    vencimento: novoVenc,
    status: "Ativo",
  });

  showToast("Pagamento registrado");

  carregarAlunos();
}
// ===== TOAST =====
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");

  t.textContent = msg;

  t.classList.remove("success", "error");

  if (type === "error") {
    t.classList.add("error");
  } else {
    t.classList.add("success");
  }

  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 3000);
}

carregarAlunos();

window.navigate = navigate;
window.openModal = openModal;
window.closeModal = closeModal;
window.onModalChange = onModalChange;
window.editAluno = editAluno;
window.renderAlunos = renderAlunos;
window.deleteAluno = deleteAluno;
window.abrirTurma = abrirTurma;
window.saveAluno = saveAluno;
window.marcarRealizada = marcarRealizada;
window.logout = logout;
window.openWhatsApp = openWhatsApp;

window.registrarPagamento = registrarPagamento;

window.abrirModalPagamento = abrirModalPagamento;
window.fecharModalPagamento = fecharModalPagamento;
window.confirmarPagamento = confirmarPagamento;
window.renderPagamentos = renderPagamentos;
