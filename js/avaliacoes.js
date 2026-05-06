import { alunos } from "./state.js";
import { diasAteVencer, fmtDate, showToast } from "./utils.js";

export function renderAvaliacoes() {
  const q = document.getElementById("search-aval")?.value?.toLowerCase() || "";
  const statusFiltro = document.getElementById("filter-aval-status")?.value || "";

  const list = alunos.filter((a) => {
    if (q && !a.nome.toLowerCase().includes(q)) return false;
    if (statusFiltro && a.statusAval !== statusFiltro) return false;
    return true;
  });

  document.getElementById("aval-empty").style.display = list.length ? "none" : "block";

  document.getElementById("aval-tbody").innerHTML = list.map((a) => {
    const idx = alunos.indexOf(a);
    const dias = diasAteVencer(a.avaliacao);
    const alert = dias <= 5 && dias >= 0 && a.statusAval === "Pendente";
    let cor = "var(--text)";
    if (alert) cor = "var(--gold)";
    if (dias < 0 && a.statusAval === "Pendente") cor = "var(--danger)";

    return `
<tr style="${alert ? "background:rgba(245,166,35,0.05)" : ""}">
<td class="td-name">${a.nome}<small>${a.tel}</small></td>
<td>${a.modalidade === "musculacao" ? "Musculação" : "Funcional"}</td>
<td style="color:${cor}">
  ${fmtDate(a.avaliacao)}
  ${alert ? '<i class="bi bi-exclamation-triangle-fill" style="margin-left:6px;color:var(--gold)"></i>' : ""}
</td>
<td>${a.responsavel}</td>
<td>${a.statusAval === "Realizada" ? '<span class="badge badge-green">Realizada</span>' : '<span class="badge badge-gold">Pendente</span>'}</td>
<td>
  ${a.statusAval === "Pendente" ? `
    <button class="icon-btn" onclick="marcarRealizada(${idx})"><i class="bi bi-check2-circle"></i></button>
    <button class="icon-btn" onclick="openWhatsAppAvaliacao('${a.tel}','${a.nome}','${a.avaliacao}')"><i class="bi bi-whatsapp"></i></button>
  ` : ""}
</td>
</tr>`;
  }).join("");
}

export function marcarRealizada(idx) {
  alunos[idx].statusAval = "Realizada";
  renderAvaliacoes();
  showToast("✅ Avaliação marcada como realizada");
}
