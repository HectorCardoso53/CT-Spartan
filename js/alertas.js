import { alunos } from "./state.js";
import { diasAteVencer, fmtDate, iniciais, diasParaAniversario } from "./utils.js";

export function renderAlertas() {
  // VENCIDOS
  const venc = alunos.filter((a) => diasAteVencer(a.vencimento) < 0);
  document.getElementById("alertas-vencidos").innerHTML = venc.length
    ? venc.map((a) => {
        const d = Math.abs(diasAteVencer(a.vencimento));
        return `<div class="alert-item">
          <div class="alert-avatar" style="background:#ef444420;color:#ef4444">${iniciais(a.nome)}</div>
          <div class="alert-info">
            <strong>${a.nome}</strong>
            <small>${a.modalidade === "musculacao" ? '<i class="bi bi-barbell"></i> Musculação' : '<i class="bi bi-lightning-charge-fill"></i> Funcional'} · ${a.horario || a.turma || ""}</small>
          </div>
          <div style="text-align:right">
            <div style="color:var(--danger);font-size:0.85rem"><i class="bi bi-exclamation-triangle-fill"></i> Vencido há ${d} dia(s)</div>
            <small style="color:var(--muted)">${fmtDate(a.vencimento)}</small>
          </div>
        </div>`;
      }).join("")
    : `<div class="empty"><div class="empty-icon"><i class="bi bi-check-circle-fill" style="color:var(--green);"></i></div><div>Nenhum plano vencido</div></div>`;

  // PRÓXIMOS 7 DIAS
  const prox = alunos.filter((a) => { const d = diasAteVencer(a.vencimento); return d >= 0 && d <= 7; });
  document.getElementById("alertas-proximos").innerHTML = prox.length
    ? prox.map((a) => {
        const d = diasAteVencer(a.vencimento);
        return `<div class="alert-item">
          <div class="alert-avatar" style="background:#f5a62320;color:#f5a623">${iniciais(a.nome)}</div>
          <div class="alert-info">
            <strong>${a.nome}</strong>
            <small>${a.modalidade === "musculacao" ? '<i class="bi bi-barbell"></i> Musculação' : '<i class="bi bi-lightning-charge-fill"></i> Funcional'} · ${a.horario || a.turma || ""}</small>
          </div>
          <div style="text-align:right">
            <div style="color:var(--gold);font-size:0.85rem">${d === 0 ? "Vence HOJE" : `Vence em ${d} dia(s)`}</div>
            <small style="color:var(--muted)">${fmtDate(a.vencimento)}</small>
          </div>
        </div>`;
      }).join("")
    : `<div class="empty"><div class="empty-icon"><i class="bi bi-emoji-smile"></i></div><div>Nenhum vencendo em breve</div></div>`;

  // AVALIAÇÕES PENDENTES
  const avals = alunos.filter((a) => a.statusAval === "Pendente" && diasAteVencer(a.avaliacao) <= 5);
  document.getElementById("alertas-avals").innerHTML = avals.length
    ? avals.map((a) => {
        const d = diasAteVencer(a.avaliacao);
        return `<div class="alert-item">
          <div class="alert-avatar" style="background:#3b82f620;color:#3b82f6">${iniciais(a.nome)}</div>
          <div class="alert-info"><strong>${a.nome}</strong><small>Resp: ${a.responsavel}</small></div>
          <div style="text-align:right">
            <div style="color:var(--blue);font-size:0.85rem">${d < 0 ? `Atrasada ${Math.abs(d)} dia(s)` : d === 0 ? "Hoje" : `Em ${d} dia(s)`}</div>
            <small>${fmtDate(a.avaliacao)}</small>
          </div>
        </div>`;
      }).join("")
    : `<div class="empty"><div class="empty-icon"><i class="bi bi-clipboard-check-fill"></i></div><div>Sem avaliações pendentes próximas</div></div>`;

  // ANIVERSARIANTES
  const aniversariantes = alunos
    .filter((a) => { const d = diasParaAniversario(a.nascimento); return d !== null && d >= 0 && d <= 7; })
    .sort((a, b) => diasParaAniversario(a.nascimento) - diasParaAniversario(b.nascimento));

  document.getElementById("alertas-aniversarios").innerHTML = aniversariantes.length
    ? aniversariantes.map((a) => {
        const d = diasParaAniversario(a.nascimento);
        return `<div class="alert-item">
          <div class="alert-avatar" style="background:#22c55e20;color:#22c55e">${iniciais(a.nome)}</div>
          <div class="alert-info">
            <strong>${a.nome}</strong>
            <small><i class="bi bi-gift-fill" style="color:#22c55e;margin-right:4px;"></i>${d === 0 ? "Aniversário HOJE!" : `Em ${d} dia(s)`}</small>
          </div>
          <div style="text-align:right"><small>${fmtDate(a.nascimento)}</small></div>
        </div>`;
      }).join("")
    : `<div class="empty"><div class="empty-icon"><i class="bi bi-emoji-smile"></i></div><div>Nenhum aniversário próximo</div></div>`;
}
