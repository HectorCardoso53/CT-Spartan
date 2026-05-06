import { fmtDate, showToast } from "./utils.js";

function formatarNumeroWpp(tel) {
  let numero = tel.replace(/\D/g, "");
  if (numero.startsWith("0")) numero = numero.substring(1);
  if (!numero.startsWith("55")) numero = "55" + numero;
  return numero;
}

export function openWhatsApp(tel, nome, vencimento) {
  if (!tel) { alert("Aluno sem telefone cadastrado."); return; }
  const numero = formatarNumeroWpp(tel);
  const mensagem = `Olá ${nome}! 👋\n\nSeu plano vence em ${fmtDate(vencimento)}.\n\nPara renovar, é só fazer o PIX 👇\n🔑 Chave: 97972673268\n\nQualquer dúvida estamos à disposição 💪🔥`;
  window.open(`https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`, "_blank");
}

export function openWhatsAppAvaliacao(tel, nome, avaliacao) {
  if (!tel) { showToast("Aluno sem telefone cadastrado.", "error"); return; }
  const numero = formatarNumeroWpp(tel);
  const mensagem = `Olá ${nome}! 👋\n\nSua avaliação física está agendada para ${fmtDate(avaliacao)}.\n\nContamos com você 💪🔥\nCT Spartan`;
  window.open(`https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`, "_blank");
}
