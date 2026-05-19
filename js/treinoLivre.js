import { alunos } from "./state.js";
import {
  diasAteVencer, fmtDate, calcularIdade,
  calcularStatusAluno, statusBadge, diasParaAniversario,
} from "./utils.js";

export function renderTreinoLivre() {
  const lista = alunos.filter((a) => a.modalidade === "treino-livre");

  const ativos    = lista.filter((a) => calcularStatusAluno(a) === "Ativo").length;
  const atrasados = lista.filter((a) => calcularStatusAluno(a) === "Atrasado").length;

  document.getElementById("tl-total").textContent    = lista.length;
  document.getElementById("tl-ativos").textContent   = ativos;
  document.getElementById("tl-atrasados").textContent = atrasados;

  document.getElementById("tl-empty").style.display = lista.length ? "none" : "block";

  document.getElementById("tl-tbody").innerHTML = lista.map((a) => {
    const idx  = alunos.indexOf(a);
    const dias = diasAteVencer(a.vencimento);
    let vencLabel = fmtDate(a.vencimento);
    let vencColor = "var(--muted)";
    if (dias < 0)              { vencLabel = `Vencido ${Math.abs(dias)}d`; vencColor = "var(--danger)"; }
    if (dias === 0)             { vencLabel = "Vence HOJE";                vencColor = "var(--gold)"; }
    if (dias > 0 && dias <= 3) { vencLabel = `Vence em ${dias}d`;         vencColor = "var(--gold)"; }

    const hoje       = new Date().toISOString().slice(0, 10);
    const ehAniversario = diasParaAniversario(a.nascimento) === 0 && a.aniversarioEnviadoEm !== hoje;

    const btnWpp = a.bemVindoEnviado === false
      ? `<button class="icon-btn" onclick="openWhatsAppBoasVindas('${a.tel}','${a.nome}','${a.id}')" style="color:#22c55e;border-color:#22c55e33;background:#22c55e11" title="Boas-vindas 🎉"><i class="bi bi-whatsapp"></i></button>`
      : ehAniversario
        ? `<button class="icon-btn" onclick="openWhatsAppAniversario('${a.tel}','${a.nome}','${a.id}')" style="color:#f5a623;border-color:#f5a62333;background:#f5a62311" title="Aniversário 🎂"><i class="bi bi-whatsapp"></i></button>`
        : `<button class="icon-btn" onclick="openWhatsApp('${a.tel}','${a.nome}','${a.vencimento}')" title="Cobrança"><i class="bi bi-whatsapp"></i></button>`;

    return `<tr>
      <td class="td-name">${a.nome}<small>${a.tel}</small></td>
      <td>
        ${a.nascimento ? fmtDate(a.nascimento) : "-"}<br>
        <small>${a.nascimento ? calcularIdade(a.nascimento) + " anos" : ""}</small>
      </td>
      <td>R$ ${Number(a.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      <td style="color:${vencColor}">${vencLabel}</td>
      <td>${statusBadge[calcularStatusAluno(a)]}</td>
      <td>
        <button class="icon-btn" onclick="abrirModalPagamento(${idx})" title="Registrar pagamento"><i class="bi bi-cash"></i></button>
        ${btnWpp}
        <button class="icon-btn" onclick="editAluno(${idx})"><i class="bi bi-pencil-square"></i></button>
        <button class="icon-btn" onclick="deleteAluno(${idx})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join("");
}
