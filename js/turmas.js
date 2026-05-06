import { alunos } from "./state.js";
import { turmaLabel } from "./utils.js";

export function renderTurmas() {
  const CAPACIDADE = 50;

  const funcTurmas = [
    { id: "manha-06", label: "Turma 1 – Manhã", time: "06:00 – 07:00" },
    { id: "noite-19", label: "Turma 2 – Noite", time: "19:00 – 20:00" },
    { id: "noite-20", label: "Turma 3 – Noite", time: "20:00 – 21:00" },
  ];

  document.getElementById("turma-funcional").innerHTML = funcTurmas.map((t) => {
    const count = alunos.filter((a) => a.modalidade === "funcional" && a.turma === t.id).length;
    const vagas = CAPACIDADE - count;
    return `<div class="turma-card" style="cursor:pointer" onclick="abrirTurma('funcional','${t.id}')">
      <div class="turma-header">
        <div><div class="turma-name">${t.label}</div><div class="turma-time">${t.time}</div></div>
        <span class="badge badge-gold"><i class="bi bi-lightning-charge-fill"></i></span>
      </div>
      <div class="turma-count">${count} / ${CAPACIDADE}<small>alunos</small></div>
      <div style="font-size:0.8rem;color:var(--muted)">${vagas} vagas disponíveis</div>
      <div style="margin-top:12px">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${Math.min((count / CAPACIDADE) * 100, 100)}%;background:var(--accent2)"></div>
        </div>
      </div>
    </div>`;
  }).join("");

  const muscHorarios = [...new Set(
    alunos.filter((a) => a.modalidade === "musculacao").map((a) => a.horario),
  )].sort((a, b) => a.localeCompare(b));

  document.getElementById("turma-musculacao").innerHTML = muscHorarios.length === 0
    ? `<div class="empty"><div class="empty-icon"><i class="bi bi-barbell"></i></div><div>Nenhum aluno cadastrado na musculação</div></div>`
    : muscHorarios.map((h) => {
        const count = alunos.filter((a) => a.modalidade === "musculacao" && a.horario === h).length;
        const vagas = CAPACIDADE - count;
        return `<div class="turma-card" style="cursor:pointer" onclick="abrirTurma('musculacao','${h}')">
          <div class="turma-header">
            <div><div class="turma-name">Musculação</div><div class="turma-time">${h}</div></div>
            <span class="badge badge-blue"><i class="bi bi-barbell"></i></span>
          </div>
          <div class="turma-count">${count} / ${CAPACIDADE}<small>alunos</small></div>
          <div style="font-size:0.8rem;color:var(--muted)">${vagas} vagas disponíveis</div>
          <div style="margin-top:12px">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${Math.min((count / CAPACIDADE) * 100, 100)}%"></div>
            </div>
          </div>
        </div>`;
      }).join("");
}

export function abrirTurma(tipo, valor) {
  window.navigate("alunos");
  document.getElementById("filter-modal").value = tipo;
  document.getElementById("search-aluno").value = "";

  if (tipo === "funcional") {
    const fh = document.getElementById("filter-horario");
    if (fh) fh.value = "";
    window.renderAlunosFiltrados(
      alunos.filter((a) => a.modalidade === "funcional" && a.turma === valor),
    );
  } else {
    document.getElementById("filter-horario").value = valor;
    window.renderAlunos();
  }
}

export function filtrarPorTurma(tipo, valor) {
  window.navigate("alunos");
  document.getElementById("filter-modal").value = tipo;
  document.getElementById("filter-horario").value = "";
  document.getElementById("search-aluno").value = "";

  if (tipo === "funcional") {
    window.renderAlunosFiltrados(
      alunos.filter((a) => a.modalidade === "funcional" && a.turma === valor),
    );
  } else if (tipo === "musculacao") {
    document.getElementById("filter-horario").value = valor;
    window.renderAlunos();
  }
}
