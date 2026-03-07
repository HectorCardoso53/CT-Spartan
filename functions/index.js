const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

setGlobalOptions({
  region: "us-central1",
  maxInstances: 5,
});

initializeApp();
const db = getFirestore();

const EMAIL_USER = defineSecret("EMAIL_USER");
const EMAIL_PASS = defineSecret("EMAIL_PASS");

exports.verificarAlertas = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "America/Manaus",
    secrets: [EMAIL_USER, EMAIL_PASS],
  },
  async () => {
    try {
      const agora = new Date();
      const tresDias = new Date();
      tresDias.setDate(agora.getDate() + 3);

      console.log("🕒 Agora:", agora);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_USER.value(),
          pass: EMAIL_PASS.value(),
        },
      });

      const snapshot = await db.collection("alunos").get();

      for (const doc of snapshot.docs) {
        const aluno = doc.data();
        if (!aluno.email) continue;

        const dataVenc = aluno.vencimento
          ? new Date(aluno.vencimento)
          : null;

        const dataAval = aluno.avaliacao
          ? new Date(aluno.avaliacao)
          : null;

        // 🔴 PLANO VENCENDO (ENVIA SÓ 1 VEZ)
        if (
          dataVenc &&
          dataVenc <= tresDias &&
          dataVenc >= agora &&
          !aluno.notificadoVencimento
        ) {
          await transporter.sendMail({
            from: EMAIL_USER.value(),
            to: aluno.email,
            subject: "🔔 Seu plano está vencendo",
            text: `Olá ${aluno.nome}, seu plano vence em ${dataVenc.toLocaleDateString("pt-BR")}.`,
          });

          await doc.ref.update({
            notificadoVencimento: true,
          });

          console.log("✅ Email vencimento enviado:", aluno.email);
        }

        // 🔵 AVALIAÇÃO PRÓXIMA (ENVIA SÓ 1 VEZ)
        if (
          dataAval &&
          dataAval <= tresDias &&
          dataAval >= agora &&
          !aluno.notificadoAvaliacao
        ) {
          await transporter.sendMail({
            from: EMAIL_USER.value(),
            to: aluno.email,
            subject: "📋 Avaliação próxima",
            text: `Olá ${aluno.nome}, sua avaliação será em ${dataAval.toLocaleDateString("pt-BR")}.`,
          });

          await doc.ref.update({
            notificadoAvaliacao: true,
          });

          console.log("✅ Email avaliação enviado:", aluno.email);
        }
      }

      console.log("✔️ Verificação finalizada");
    } catch (error) {
      console.error("❌ Erro:", error);
    }
  }
);