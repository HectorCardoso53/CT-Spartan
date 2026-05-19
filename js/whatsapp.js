import { db } from "./firebase.js";
import {
  doc, updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { alunos } from "./state.js";
import { fmtDate, showToast, diasAteVencer } from "./utils.js";

function formatarNumeroWpp(tel) {
  let numero = tel.replace(/\D/g, "");
  if (numero.startsWith("0")) numero = numero.substring(1);
  if (!numero.startsWith("55")) numero = "55" + numero;
  return numero;
}

export function openWhatsApp(tel, nome, vencimento) {
  if (!tel) { showToast("Aluno sem telefone cadastrado.", "error"); return; }
  const numero = formatarNumeroWpp(tel);
  const dias = diasAteVencer(vencimento);
  const statusPlano =
    dias < 0  ? `Seu plano venceu em ${fmtDate(vencimento)}.` :
    dias === 0 ? `Seu plano venceu hoje.` :
                 `Seu plano vai vencer dia ${fmtDate(vencimento)}.`;

  const mensagem = `Olá ${nome}! 👋\n\n${statusPlano}\n\nPara renovar, é só fazer o PIX 👇\n🔑 Chave: 97972673268\n\nQualquer dúvida estamos à disposição 💪🔥`;
  window.open(`https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`, "_blank");
}

export async function openWhatsAppBoasVindas(tel, nome, alunoId) {
  if (!tel) { showToast("Aluno sem telefone cadastrado.", "error"); return; }
  const numero = formatarNumeroWpp(tel);
  const mensagem = `Olá ${nome}! 👋\n\nSeja bem-vindo(a) ao CT Spartan! 🏆\n\nEstamos muito felizes em ter você com a gente.\nQualquer dúvida é só chamar 💪🔥\n\nCT Spartan`;
  window.open(`https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`, "_blank");

  await updateDoc(doc(db, "alunos", alunoId), { bemVindoEnviado: true });
  await window.carregarAlunos();
}

export async function openWhatsAppAniversario(tel, nome, alunoId) {
  if (!tel) { showToast("Aluno sem telefone cadastrado.", "error"); return; }
  const numero = formatarNumeroWpp(tel);
  const mensagem = `Olá ${nome}! 🎂\n\nFeliz Aniversário! 🎉🎊\n\nO CT Spartan te deseja um dia incrível!\nQue venha mais um ano de muito treino e conquistas! 💪🔥\n\nCT Spartan`;
  window.open(`https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`, "_blank");

  const hoje = new Date().toISOString().slice(0, 10);
  await updateDoc(doc(db, "alunos", alunoId), { aniversarioEnviadoEm: hoje });
  await window.carregarAlunos();
}

export function transmitirSolicitarNascimento() {
  const semNascimento = alunos.filter((a) => !a.nascimento && a.tel);

  if (semNascimento.length === 0) {
    showToast("Todos os alunos já têm data de nascimento cadastrada!", "success");
    return;
  }

  if (!confirm(`Enviar mensagem para ${semNascimento.length} aluno(s) sem data de nascimento?`)) return;

  semNascimento.forEach((a, i) => {
    const numero = formatarNumeroWpp(a.tel);
    const mensagem = `Olá ${a.nome}! 👋\n\nPrecisamos que você nos informe sua data de nascimento para manter seu cadastro atualizado no CT Spartan.\n\nPor favor, nos responda com sua data no formato DD/MM/AAAA.\n\nObrigado! 💪🔥\nCT Spartan`;
    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`, "_blank");
    }, i * 1500);
  });

  showToast(`Enviando para ${semNascimento.length} aluno(s)...`);
}

export function openWhatsAppAvaliacao(tel, nome, avaliacao) {
  if (!tel) { showToast("Aluno sem telefone cadastrado.", "error"); return; }
  const numero = formatarNumeroWpp(tel);
  const mensagem = `Olá ${nome}! 👋\n\nSua avaliação física está agendada para ${fmtDate(avaliacao)}.\n\nContamos com você 💪🔥\nCT Spartan`;
  window.open(`https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`, "_blank");
}
