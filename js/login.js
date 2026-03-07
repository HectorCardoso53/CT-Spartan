import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// LOGIN REAL
window.handleLogin = async function (e) {
  e.preventDefault();

  const email = document.getElementById("inp-user").value.trim();
  const pass = document.getElementById("inp-pass").value;
  const errEl = document.getElementById("error-msg");

  document.getElementById("spinner").style.display = "block";
  document.getElementById("btn-text").textContent = "VERIFICANDO...";

  try {
    await signInWithEmailAndPassword(auth, email, pass);

    document.getElementById("success-overlay").classList.add("show");

    setTimeout(() => {
      window.location.href = "home.html";
    }, 1200);

  } catch (error) {
    document.getElementById("spinner").style.display = "none";
    document.getElementById("btn-text").textContent = "ENTRAR NO SISTEMA";
    errEl.classList.add("show");
  }
};

// ── CANVAS BACKGROUND ──
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let W,
  H,
  lines = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

class Line {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.len = 40 + Math.random() * 120;
    this.speed = 0.2 + Math.random() * 0.5;
    this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    this.alpha = 0;
    this.fadeIn = true;
    this.maxAlpha = 0.03 + Math.random() * 0.06;
    this.life = 0;
    this.maxLife = 80 + Math.random() * 120;
  }
  update() {
    this.y -= this.speed;
    this.life++;
    if (this.fadeIn) {
      this.alpha += 0.003;
      if (this.alpha >= this.maxAlpha) this.fadeIn = false;
    } else {
      this.alpha -= 0.001;
    }
    if (this.life > this.maxLife || this.alpha <= 0) this.reset();
  }
  draw() {
    ctx.save();
    ctx.strokeStyle = `rgba(232,52,42,${this.alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x + Math.cos(this.angle) * this.len,
      this.y + Math.sin(this.angle) * this.len,
    );
    ctx.stroke();
    ctx.restore();
  }
}

for (let i = 0; i < 80; i++) {
  const l = new Line();
  l.life = Math.random() * 100;
  lines.push(l);
}

// Grid dots
function drawGrid() {
  const spacing = 48;
  ctx.fillStyle = "rgba(255,255,255,0.018)";
  for (let x = 0; x < W; x += spacing) {
    for (let y = 0; y < H; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  lines.forEach((l) => {
    l.update();
    l.draw();
  });
  requestAnimationFrame(animate);
}
animate();

// ── PARTICLES ──
function spawnParticles() {
  for (let i = 0; i < 6; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = 2 + Math.random() * 3;
    p.style.cssText = `
      left:${Math.random() * 100}vw; bottom:0;
      width:${size}px; height:${size}px;
      background:rgba(232,52,42,${0.15 + Math.random() * 0.2});
      animation-duration:${8 + Math.random() * 10}s;
      animation-delay:${Math.random() * 5}s;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 20000);
  }
}
setInterval(spawnParticles, 2000);
spawnParticles();


// LOGIN REAL
window.handleLogin = async function (e) {
  e.preventDefault();

  const email = document.getElementById("inp-user").value.trim();
  const pass = document.getElementById("inp-pass").value.trim();
  const errEl = document.getElementById("error-msg");
  const spinner = document.getElementById("spinner");
  const btnText = document.getElementById("btn-text");

  // 🔴 VALIDAÇÃO DE CAMPOS VAZIOS
  if (!email || !pass) {
    errEl.innerHTML = "<span>⚠️</span> Preencha todos os campos.";
    errEl.classList.add("show");

    // animação shake no card
    document.querySelector(".login-card").style.animation = "shake 0.4s";
    setTimeout(() => {
      document.querySelector(".login-card").style.animation = "";
    }, 400);

    return; // ⛔ PARA A EXECUÇÃO AQUI
  }

  // limpa erro anterior
  errEl.classList.remove("show");

  spinner.style.display = "block";
  btnText.textContent = "VERIFICANDO...";

  try {
    await signInWithEmailAndPassword(auth, email, pass);

    document.getElementById("success-overlay").classList.add("show");

    setTimeout(() => {
      window.location.href = "home.html";
    }, 1200);

  } catch (error) {
    spinner.style.display = "none";
    btnText.textContent = "ENTRAR NO SISTEMA";

    errEl.innerHTML =
      "<span>⚠️</span> Usuário ou senha incorretos. Tente novamente.";
    errEl.classList.add("show");

    document.querySelector(".login-card").style.animation = "shake 0.4s";
    setTimeout(() => {
      document.querySelector(".login-card").style.animation = "";
    }, 400);
  }
};

// ── TOGGLE PASS ──
function togglePass() {
  const inp = document.getElementById("inp-pass");
  inp.type = inp.type === "password" ? "text" : "password";
}

// ── FORGOT ──
function showForgot() {
  alert("Entre em contato com o administrador do sistema.");
}

// ── SHAKE ANIMATION ──
const style = document.createElement("style");
style.textContent =
  "@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }";
document.head.appendChild(style);

// ── COUNTER ANIMATION ──
function animCount(el, target, duration) {
  let start = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target;
      clearInterval(timer);
      return;
    }
    el.textContent = Math.floor(start);
  }, duration / 60);
}
setTimeout(() => animCount(document.getElementById("n-ativos"), 8, 1000), 400);
