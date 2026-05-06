import { alunos, pagamentos } from "./state.js";
import {
  diasAteVencer, fmtDate, iniciais, calcularStatusAluno, avatarColors,
} from "./utils.js";

export function renderDashboard() {
  const ativos = alunos.filter((a) => a.status === "Ativo").length;
  const musc = alunos.filter((a) => a.modalidade === "musculacao").length;
  const func = alunos.filter((a) => a.modalidade === "funcional").length;
  const venc7 = alunos.filter((a) => { const d = diasAteVencer(a.vencimento); return d >= 0 && d <= 7; }).length;

  document.getElementById("stat-ativos").textContent = ativos;
  document.getElementById("stat-musc").textContent = musc;
  document.getElementById("stat-func").textContent = func;
  document.getElementById("stat-venc").textContent = venc7;
  document.getElementById("leg-musc").textContent = musc;
  document.getElementById("leg-func").textContent = func;

  const atrasados = alunos.filter((a) => calcularStatusAluno(a) === "Atrasado").length;
  document.getElementById("leg-atr").textContent = atrasados;

  // DONUT
  const total = alunos.length || 1;
  const circ = 2 * Math.PI * 45;
  const muscDash = (musc / total) * circ;
  const funcDash = (func / total) * circ;
  document.getElementById("donut-musc").setAttribute("stroke-dasharray", `${muscDash} ${circ - muscDash}`);
  document.getElementById("donut-func").setAttribute("stroke-dasharray", `${funcDash} ${circ - funcDash}`);
  document.getElementById("donut-func").setAttribute("stroke-dashoffset", -muscDash + circ * 0.25);

  // ALERTAS DE VENCIMENTO
  const alertasEl = document.getElementById("dash-alertas");
  const alertasList = alunos
    .filter((a) => { const d = diasAteVencer(a.vencimento); return d <= 3 && d >= -30; })
    .slice(0, 5);

  alertasEl.innerHTML = alertasList.length === 0
    ? `<div class="empty"><div class="empty-icon"><i class="bi bi-check-circle-fill text-success"></i></div><div>Nenhum alerta!</div></div>`
    : alertasList.map((a, i) => {
        const d = diasAteVencer(a.vencimento);
        const msg = d < 0 ? `Vencido há ${Math.abs(d)} dia(s)` : d === 0 ? "Vence HOJE" : `Vence em ${d} dia(s)`;
        const color = d < 0 ? "#ef4444" : d === 0 ? "#f5a623" : "#ff6b35";
        return `<div class="alert-item">
          <div class="alert-avatar" style="background:${avatarColors[i % 6]}22;color:${avatarColors[i % 6]}">${iniciais(a.nome)}</div>
          <div class="alert-info"><strong>${a.nome}</strong><small>${msg}</small></div>
          <span class="badge" style="background:${color}22;color:${color};font-size:0.75rem">${fmtDate(a.vencimento)}</span>
        </div>`;
      }).join("");

  // AVALIAÇÕES DA SEMANA
  const avalsEl = document.getElementById("dash-avals");
  const avalsList = alunos
    .filter((a) => { const d = diasAteVencer(a.avaliacao); return d <= 5 && d >= 0 && a.statusAval === "Pendente"; })
    .slice(0, 5);

  avalsEl.innerHTML = avalsList.length === 0
    ? `<div class="empty"><div class="empty-icon"><i class="bi bi-clipboard-check-fill text-success"></i></div><div>Sem avaliações próximas</div></div>`
    : avalsList.map((a, i) => {
        const d = diasAteVencer(a.avaliacao);
        return `<div class="aval-row">
          <div class="aval-icon" style="background:${avatarColors[i % 6]}22"><i class="bi bi-person-fill"></i></div>
          <div style="flex:1">
            <strong style="font-size:0.88rem">${a.nome}</strong><br>
            <small style="color:var(--muted)">${d === 0 ? "Hoje" : `Em ${d} dia(s)`} • ${a.responsavel}</small>
          </div>
          <span class="badge badge-gold">Pendente</span>
        </div>`;
      }).join("");

  // BAR CHART MUSCULAÇÃO
  const horarios = [...new Set(
    alunos.filter((a) => a.modalidade === "musculacao").map((a) => a.horario),
  )].sort((a, b) => a.localeCompare(b));

  const chart = document.getElementById("bar-chart-musc");

  if (horarios.length === 0) {
    chart.innerHTML = `<div class="empty"><div class="empty-icon"><i class="bi bi-barbell"></i></div><div>Nenhum aluno na musculação</div></div>`;
  } else {
    const counts = horarios.map((h) =>
      alunos.filter((a) => a.modalidade === "musculacao" && a.horario === h).length,
    );
    const maxC = Math.max(...counts, 1);
    chart.innerHTML = horarios.map((h, i) => `
      <div class="bar-group">
        <div class="bar-val">${counts[i]}</div>
        <div class="bar" style="height:${(counts[i] / maxC) * 80}px" title="${h}: ${counts[i]} alunos"></div>
        <div class="bar-label">${h.replace(":00", "h")}</div>
      </div>`).join("");
  }

  // FINANCEIRO
  const mesAtual = new Date().toISOString().slice(0, 7);
  const fatMes = pagamentos
    .filter((p) => p.mes === mesAtual)
    .reduce((sum, p) => sum + Number(p.valor), 0);
  const inadimplentes = alunos.filter((a) => calcularStatusAluno(a) === "Atrasado").length;
  const recEsperada = alunos
    .filter((a) => a.status === "Ativo")
    .reduce((sum, a) => sum + Number(a.valor || 0), 0);

  const elFat = document.getElementById("stat-fat-mes");
  if (elFat) elFat.textContent = "R$ " + fatMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const elInad = document.getElementById("stat-inadimplentes");
  if (elInad) elInad.textContent = inadimplentes;

  const elRec = document.getElementById("stat-rec-esperada");
  if (elRec) elRec.textContent = "R$ " + recEsperada.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  renderGraficoReceita();
}

export function renderGraficoReceita() {
  const canvas = document.getElementById("chart-receita");
  if (!canvas) return;

  const hoje = new Date();
  const mesesPt = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const labels = [];
  const valores = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = pagamentos
      .filter((p) => p.mes === mesStr)
      .reduce((sum, p) => sum + Number(p.valor), 0);
    labels.push(`${mesesPt[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`);
    valores.push(total);
  }

  if (window._chartReceita) { window._chartReceita.destroy(); window._chartReceita = null; }

  window._chartReceita = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: valores.map((_, i) => i === 5 ? "rgba(232,52,42,0.85)" : "rgba(232,52,42,0.3)"),
        borderColor: "#e8342a",
        borderWidth: 1,
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => "R$ " + Number(ctx.raw).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
          },
        },
      },
      scales: {
        x: { grid: { color: "rgba(42,42,61,0.6)" }, ticks: { color: "#7070a0", font: { family: "Outfit" } } },
        y: {
          grid: { color: "rgba(42,42,61,0.6)" },
          beginAtZero: true,
          ticks: { color: "#7070a0", font: { family: "Outfit" }, callback: (v) => "R$ " + v.toLocaleString("pt-BR") },
        },
      },
    },
  });
}
