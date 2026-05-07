export const avatarColors = ["#e8342a", "#3b82f6", "#ff6b35", "#22c55e", "#a855f7", "#f5a623"];

export const statusBadge = {
  Ativo: `<span class="badge badge-green"><i class="bi bi-check-circle-fill" style="margin-right:4px;"></i>Ativo</span>`,
  Atrasado: `<span class="badge badge-red"><i class="bi bi-exclamation-triangle-fill" style="margin-right:4px;"></i>Atrasado</span>`,
  Inativo: `<span class="badge" style="background:rgba(100,100,120,0.2);color:#7070a0"><i class="bi bi-x-circle-fill" style="margin-right:4px;"></i>Inativo</span>`,
};

export const turmaLabel = {
  "manha-06": "Manhã 06:00",
  "noite-19": "Noite 19:00",
  "noite-20": "Noite 20:00",
};

export function showLoading(msg = "Carregando...") {
  let el = document.getElementById("_loading_overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "_loading_overlay";
    el.style.cssText = `
      position:fixed;inset:0;z-index:9000;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:16px;
      background:rgba(6,6,8,0.72);backdrop-filter:blur(4px);
    `;
    el.innerHTML = `
      <div style="width:48px;height:48px;border-radius:50%;
                  border:3px solid rgba(232,52,42,0.2);
                  border-top-color:var(--accent, #e8342a);
                  animation:_spin .7s linear infinite;"></div>
      <div id="_loading_msg"
           style="font-family:'DM Sans',sans-serif;font-size:0.9rem;
                  color:rgba(240,240,245,0.75);letter-spacing:0.4px;">${msg}</div>
    `;
    if (!document.getElementById("_loading_style")) {
      const s = document.createElement("style");
      s.id = "_loading_style";
      s.textContent = "@keyframes _spin{to{transform:rotate(360deg)}}";
      document.head.appendChild(s);
    }
    document.body.appendChild(el);
  } else {
    document.getElementById("_loading_msg").textContent = msg;
    el.style.display = "flex";
  }
}

export function hideLoading() {
  const el = document.getElementById("_loading_overlay");
  if (el) el.style.display = "none";
}

export function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("success", "error");
  if (type === "error") t.classList.add("error");
  else t.classList.add("success");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

export function fmtDate(d) {
  if (!d) return "–";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}

export function iniciais(nome) {
  return nome.split(" ").slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

export function diasAteVencer(dateStr) {
  if (!dateStr) return 0;
  const [y, m, d] = dateStr.split("-").map(Number);
  const data = new Date(y, m - 1, d);
  const hojeLocal = new Date();
  hojeLocal.setHours(0, 0, 0, 0);
  return Math.floor((data - hojeLocal) / 86400000);
}

export function calcularIdade(dataNasc) {
  if (!dataNasc) return "-";
  const hoje = new Date();
  const [y, m, d] = dataNasc.split("-").map(Number);
  let idade = hoje.getFullYear() - y;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
  return idade;
}

export function diasParaAniversario(dataNasc) {
  if (!dataNasc) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [, mes, dia] = dataNasc.split("-").map(Number);
  let prox = new Date(hoje.getFullYear(), mes - 1, dia);
  if (prox < hoje) prox = new Date(hoje.getFullYear() + 1, mes - 1, dia);
  return Math.ceil((prox - hoje) / (1000 * 60 * 60 * 24));
}

export function daysFromNow(d) {
  const r = new Date();
  r.setDate(r.getDate() + d);
  return r.toISOString().slice(0, 10);
}

export function calcularStatusAluno(a) {
  if (a.status === "Inativo") return "Inativo";
  if (diasAteVencer(a.vencimento) < 0) return "Atrasado";
  return "Ativo";
}
