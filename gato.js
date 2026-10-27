// O gatinho, desenhado em Canvas 2D. Não usa imagem nenhuma: cor, pelagem, tamanho do pelo
// e roupinha mudam trocando um parâmetro, sem precisar de um desenho para cada combinação.
// Estilo Usagi Shima: contorno marrom grosso, cor chapada, formas redondas, cabeção de chibi.
//
// Coordenadas locais: origem no chão entre as patas, para cima é y negativo.
// Cabeça com ~100 de largura; gato inteiro com ~150 de altura (sem chapéu).

export const LINHA = '#5a3e36';
const TAU = Math.PI * 2;

export const PELAGENS = {
  branco: { nome: 'Branco', base: '#fffaf4', sombra: '#efe5d9' },
  preto: { nome: 'Preto', base: '#564d5d', sombra: '#463e4c', olho: '#f2c566', traco: '#f1e4d6', orelha: '#d98d9f' },
  cinza: { nome: 'Cinza', base: '#c7c5cf', sombra: '#b2b0bd', focinho: true },
  marrom: { nome: 'Marrom', base: '#b48e74', sombra: '#9e7962', focinho: true },
  bege: { nome: 'Bege', base: '#f1dfc4', sombra: '#e3ccab', focinho: true },
  laranja: { nome: 'Laranja', base: '#f7b97a', sombra: '#eda465', focinho: true },
  frajola: { nome: 'Preto e branco', base: '#fffaf4', sombra: '#efe5d9', mancha: '#564d5d', padrao: 'frajola' },
  rajadoCinza: { nome: 'Rajado cinza', base: '#ccc9d3', sombra: '#b6b3c1', listra: '#8f8a9f', padrao: 'rajado', focinho: true },
  rajadoLaranja: { nome: 'Rajado laranja', base: '#f8bf85', sombra: '#efaa6c', listra: '#df8b48', padrao: 'rajado', focinho: true },
  tricolor: { nome: 'Tricolor', base: '#fffaf4', sombra: '#efe5d9', mancha: '#f3a75f', mancha2: '#5c5161', padrao: 'tricolor' },
  siames: { nome: 'Siamês', base: '#f7ecdd', sombra: '#e9d9c3', mancha: '#7f6354', focinhoCor: '#c9ab98', padrao: 'siames', olho: '#8ec4ec' },
};
export const PELOS = { curto: 'Curto', medio: 'Médio', longo: 'Longo' };

const CAB = { y: -90, rx: 50, ry: 42 };
const CORPO = { y: -31, rx: 37, ry: 31 };
const PESCOCO_Y = -50;

// O gato TEM contorno marrom. Em 2026-10-27 ele foi tirado por engano ("tirar as bordas" era do
// quarto, não do gato) e voltou no mesmo dia. O modo sem contorno ficou pronto e testado:
// CONTORNO = false troca a linha por uma sombrinha macia em cada parte do corpo.
const CONTORNO = true;
function silhueta(ctx, desenhar) {
  ctx.save();
  const m = ctx.getTransform(), k = Math.hypot(m.a, m.b);   // a sombra é em pixel de tela: acompanha a escala
  ctx.shadowColor = 'rgba(90,62,54,.28)'; ctx.shadowBlur = 6 * k; ctx.shadowOffsetY = 1.5 * k;
  desenhar();
  ctx.restore();
}
// Parte do corpo: preenche e, só no modo antigo, contorna.
function parte(ctx, cor, path, lw = 3) {
  if (!CONTORNO) { silhueta(ctx, () => { ctx.fillStyle = cor; path ? ctx.fill(path) : ctx.fill(); }); return; }
  ctx.fillStyle = cor; path ? ctx.fill(path) : ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = LINHA; path ? ctx.stroke(path) : ctx.stroke();
}

const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function elipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); }
function linha(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function circulo(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function contornar(ctx, preenchimento, largura = 3) {
  ctx.fillStyle = preenchimento; ctx.fill();
  ctx.lineWidth = largura; ctx.strokeStyle = LINHA; ctx.stroke();
}

// ---------- silhueta: o pelo médio e longo viram tufinhos no contorno ----------
// `desloc(a)` empurra o contorno para fora no ângulo `a`; sem ele, é uma elipse lisa.
function oval(cx, cy, rx, ry, desloc = null) {
  const p = new Path2D();
  if (!desloc) { p.ellipse(cx, cy, rx, ry, 0, 0, TAU); return p; }
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU, f = desloc(a);
    const x = cx + Math.cos(a) * (rx + f), y = cy + Math.sin(a) * (ry + f);
    if (i) p.lineTo(x, y); else p.moveTo(x, y);
  }
  p.closePath();
  return p;
}
// tufo = pico pontudo (bochecha); nuvem = ondinha redonda (pelo longo, macio)
const tufo = (amp, peso, n) => a => amp * peso(a) * (1 - Math.sqrt(Math.abs(Math.sin(n * a / 2))));
const nuvem = (amp, peso, n) => a => amp * peso(a) * Math.pow(Math.abs(Math.sin(n * a / 2)), 0.8);
const soma = (...fs) => a => fs.reduce((t, f) => t + f(a), 0);
const pesoBochecha = a => Math.pow(Math.max(0, Math.cos(a - 0.5)), 5) + Math.pow(Math.max(0, Math.cos(a - Math.PI + 0.5)), 5);
const pesoCabecaLonga = a => 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(a));  // mais fofo embaixo, quase liso no topo
const pesoCorpoLongo = a => 1 - Math.pow(Math.max(0, Math.sin(a)), 4); // não arrepia onde encosta no chão

// Mechas lisas: poucas pontas longas e macias (curva de sino), não dezenas de ondinhas —
// muitas ondinhas pequenas no contorno inteiro deixavam o pelo longo com cara de embolado.
const difAng = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const mechas = lista => a => lista.reduce((t, [ang, amp, larg]) => t + amp * Math.exp(-Math.pow(difAng(a, ang) / larg, 2)), 0);
const espelhar = lista => lista.flatMap(([ang, amp, larg]) => [[ang, amp, larg], [Math.PI - ang, amp, larg]]);
const MECHAS_LONGO = [...espelhar([[0.12, 7, 0.11], [0.42, 11, 0.12], [0.74, 8, 0.11]]), [-Math.PI / 2 + 0.1, 5, 0.07]];

const cacheFormas = {};
function formas(pelo) {
  if (cacheFormas[pelo]) return cacheFormas[pelo];
  const cab = pelo === 'longo' ? oval(0, CAB.y, CAB.rx + 2, CAB.ry + 1, mechas(MECHAS_LONGO))
    : pelo === 'medio' ? oval(0, CAB.y, CAB.rx, CAB.ry, tufo(6, pesoBochecha, 18))
      : oval(0, CAB.y, CAB.rx, CAB.ry);
  const corpo = pelo === 'longo' ? oval(0, CORPO.y, CORPO.rx + 3, CORPO.ry + 1) : oval(0, CORPO.y, CORPO.rx, CORPO.ry);
  return (cacheFormas[pelo] = { cab, corpo });
}

// ---------- partes ----------
function girar([x, y], [px, py], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c];
}
function trianguloRedondo(p, A, T, B, rBase, rPonta) {
  p.moveTo((A[0] + B[0]) / 2, (A[1] + B[1]) / 2);
  p.arcTo(A[0], A[1], T[0], T[1], rBase);
  p.arcTo(T[0], T[1], B[0], B[1], rPonta);
  p.arcTo(B[0], B[1], A[0], A[1], rBase);
  p.closePath();
}
function orelha(ctx, lado, pal, cor, caida, twitch, pelo) {
  const A0 = [lado * 49, -99], T0 = [lado * 43, -151], B0 = [lado * 13, -126];
  const piv = [(A0[0] + B0[0]) / 2, (A0[1] + B0[1]) / 2];
  const ang = lado * (caida * 0.75 + twitch);
  const [A, T, B] = [A0, T0, B0].map(q => girar(q, piv, ang));
  const p = new Path2D();
  trianguloRedondo(p, A, T, B, 10, 7);
  parte(ctx, cor, p);
  const c = [(A[0] + T[0] + B[0]) / 3, (A[1] + T[1] + B[1]) / 3 + 3];
  const enc = q => [c[0] + (q[0] - c[0]) * 0.52, c[1] + (q[1] - c[1]) * 0.52];
  const pi = new Path2D();
  trianguloRedondo(pi, enc(A), enc(T), enc(B), 4, 3);
  ctx.fillStyle = pal.orelha || '#f6b3c2'; ctx.fill(pi);
  if (pelo === 'longo') {                         // tufinhos saindo de dentro da orelha
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    for (const k of [-0.25, 0, 0.25]) {
      const x0 = M[0] + (B[0] - A[0]) * k * 0.6, y0 = M[1] + (B[1] - A[1]) * k * 0.6 + 2;
      linha(ctx, x0, y0, x0 + (T[0] - M[0]) * 0.45 + (B[0] - A[0]) * k * 0.15, y0 + (T[1] - M[1]) * 0.45);
    }
  }
}
function corOrelha(pal, lado) {
  if (pal.padrao === 'frajola' || pal.padrao === 'siames') return pal.mancha;
  if (pal.padrao === 'tricolor') return lado < 0 ? pal.mancha : pal.mancha2;
  return pal.base;
}

function cauda(ctx, pal, pelo, fase) {
  const w = pelo === 'longo' ? 21 : pelo === 'medio' ? 14 : 12;
  const p = new Path2D();
  p.moveTo(20, -12);
  p.bezierCurveTo(56, -8, 64 + fase * 5, -44, 50 + fase * 16, -76 + Math.abs(fase) * 5);
  ctx.save();
  ctx.lineCap = 'round';
  if (CONTORNO) { ctx.lineWidth = w + 6; ctx.strokeStyle = LINHA; ctx.stroke(p); }
  const cor = pal.padrao === 'frajola' || pal.padrao === 'siames' || pal.padrao === 'tricolor' ? pal.mancha : pal.base;
  const fio = () => { ctx.lineWidth = w; ctx.strokeStyle = cor; ctx.stroke(p); };
  if (CONTORNO) fio(); else silhueta(ctx, fio);
  if (pal.padrao === 'rajado' || pal.padrao === 'tricolor') {
    ctx.setLineDash([5, 9]); ctx.lineCap = 'butt';
    ctx.strokeStyle = pal.padrao === 'rajado' ? pal.listra : pal.mancha2;
    ctx.stroke(p);
  }
  ctx.restore();
}

function mancha(ctx, cor, x, y, rx, ry, rot) { ctx.fillStyle = cor; elipse(ctx, x, y, rx, ry, rot); ctx.fill(); }

// Peitinho fofo embaixo do queixo. Médio: nuvenzinha clara. Longo: babador liso com três pontas.
function tufoPeito(ctx, pelo) {
  if (pelo === 'longo') {
    ctx.beginPath();
    ctx.moveTo(-29, -66);
    ctx.quadraticCurveTo(-31, -43, -18, -28);
    ctx.quadraticCurveTo(-9, -39, 0, -22);
    ctx.quadraticCurveTo(9, -39, 18, -28);
    ctx.quadraticCurveTo(31, -43, 29, -66);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
    if (CONTORNO) { ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,62,54,.28)'; ctx.stroke(); }
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(90,62,54,.18)'; ctx.lineCap = 'round';
    for (const l of [-1, 1]) { ctx.beginPath(); ctx.moveTo(l * 9, -50); ctx.quadraticCurveTo(l * 11, -42, l * 8, -36); ctx.stroke(); }
    return;
  }
  ctx.beginPath();
  for (const [x, y, r] of [[-8, -47, 8], [0, -44, 9], [8, -47, 8]]) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
}

function sueter(ctx) {
  ctx.fillStyle = '#f7c3cf'; ctx.fillRect(-60, -72, 120, 60);
  ctx.fillStyle = '#fffaf4';
  for (const y of [-54, -40, -26]) ctx.fillRect(-60, y, 120, 5);
  ctx.fillStyle = '#ef9fb3'; ctx.fillRect(-60, -17, 120, 5);
  ctx.strokeStyle = LINHA; ctx.lineWidth = 2;
  linha(ctx, -60, -12, 60, -12);
}

function corpo(ctx, pal, F, pelo, roupaCorpo) {
  parte(ctx, pal.base, F.corpo);
  ctx.save();
  ctx.clip(F.corpo);
  mancha(ctx, pal.sombra, 0, 6, 46, 16, 0);              // barriguinha mais escura embaixo: dá volume
  if (pal.padrao === 'frajola') {
    ctx.fillStyle = pal.mancha; ctx.fillRect(-60, -80, 120, 90);
    mancha(ctx, pal.base, 0, -24, 19, 32, 0);
  } else if (pal.padrao === 'tricolor') {
    mancha(ctx, pal.mancha, -24, -40, 17, 14, 0.3);
    mancha(ctx, pal.mancha2, 25, -20, 15, 12, -0.2);
  } else if (pal.padrao === 'rajado') {
    ctx.strokeStyle = pal.listra; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    for (const y of [-46, -32, -18]) for (const l of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(l * 40, y); ctx.quadraticCurveTo(l * 30, y - 4, l * 23, y + 1); ctx.stroke();
    }
  } else if (pal.padrao === 'siames') {
    const gr = ctx.createLinearGradient(0, -60, 0, 0);
    gr.addColorStop(0, rgba(pal.mancha, 0)); gr.addColorStop(1, rgba(pal.mancha, 0.35));
    ctx.fillStyle = gr; ctx.fillRect(-50, -70, 100, 75);
  }
  if (roupaCorpo === 'sueter') sueter(ctx);
  else if (pelo !== 'curto') tufoPeito(ctx, pelo);
  ctx.restore();
}

function pata(ctx, x, y, cor) {
  elipse(ctx, x, y, 10, 7.5);
  parte(ctx, cor, null, 2.6);
  ctx.lineWidth = 1.8; ctx.strokeStyle = CONTORNO ? LINHA : 'rgba(90,62,54,.4)';
  linha(ctx, x - 3.2, y + 2, x - 3.2, y + 5.5);
  linha(ctx, x + 3.2, y + 2, x + 3.2, y + 5.5);
}
const corPata = pal => pal.padrao === 'siames' ? pal.mancha : pal.base;
function patasTraseiras(ctx, pal) {
  for (const l of [-1, 1]) { elipse(ctx, l * 29, -4, 12, 7); parte(ctx, corPata(pal), null, 2.6); }
}
function patas(ctx, pal, modo) {
  const c = corPata(pal);
  const baixo = l => pata(ctx, l * 14, -4, c), cima = l => pata(ctx, l * 38, -63, c);
  if (modo === 'livro') { pata(ctx, -27, -37, c); pata(ctx, 27, -37, c); }
  else if (modo === 'cima') { cima(-1); cima(1); }
  else if (modo === 'esquerda') { cima(-1); baixo(1); }
  else if (modo === 'direita') { baixo(-1); cima(1); }
  else { baixo(-1); baixo(1); }
}

function cabeca(ctx, pal, F) {
  parte(ctx, pal.base, F.cab);
  ctx.save();
  ctx.clip(F.cab);
  switch (pal.padrao) {
    case 'frajola':
      ctx.fillStyle = pal.mancha; ctx.fillRect(-70, -150, 140, 110);
      ctx.fillStyle = pal.base; ctx.beginPath();
      ctx.moveTo(0, -105); ctx.quadraticCurveTo(-9, -88, -27, -77);
      ctx.bezierCurveTo(-36, -48, 36, -48, 27, -77);
      ctx.quadraticCurveTo(9, -88, 0, -105); ctx.fill();
      break;
    case 'tricolor':
      mancha(ctx, pal.mancha, -30, -116, 30, 22, -0.4);
      mancha(ctx, pal.mancha2, 33, -118, 24, 18, 0.35);
      break;
    case 'siames': {
      // máscara do focinho chapada, como o resto do desenho (degradê parecia sujeira)
      mancha(ctx, pal.focinhoCor, 0, -75, 19, 13.5, 0);
      break;
    }
    case 'rajado':
      ctx.strokeStyle = pal.listra; ctx.lineWidth = 4; ctx.lineCap = 'round';
      linha(ctx, -11, -125, -8, -111); linha(ctx, 0, -129, 0, -114); linha(ctx, 11, -125, 8, -111);
      for (const l of [-1, 1]) { linha(ctx, l * 52, -96, l * 41, -93); linha(ctx, l * 52, -86, l * 42, -85); }
      break;
  }
  if (pal.focinho) mancha(ctx, 'rgba(255,255,255,.45)', 0, -73, 17, 11, 0);
  mancha(ctx, 'rgba(255,255,255,.16)', -20, -114, 17, 9, -0.3);   // brilho no alto da cabeça
  ctx.restore();
}

// ---------- rosto ----------
function olho(ctx, x, y, tipo, pal, olhar, lado, tr) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = tr; ctx.lineWidth = 3.2;
  if (tipo === 'feliz') { ctx.beginPath(); ctx.arc(x, y + 4, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); return; }
  if (tipo === 'fechado') { ctx.beginPath(); ctx.arc(x, y - 3, 7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); return; }
  if (tipo === 'piscando') { linha(ctx, x - 7, y + 1, x + 7, y + 1); return; }
  if (tipo === 'aperto') {                       // >  <  (choro forte)
    const d = -lado;
    ctx.beginPath(); ctx.moveTo(x - 6 * d, y - 6); ctx.lineTo(x + 5 * d, y); ctx.lineTo(x - 6 * d, y + 6); ctx.stroke();
    return;
  }
  const iris = pal.olho || '#3d2e2e';
  if (tipo === 'doente') {
    elipse(ctx, x, y + 2, 7, 5.5); ctx.fillStyle = iris; ctx.fill();
    circulo(ctx, x + 2.4, y + 0.5, 1.8); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - 8.5, y - 3); ctx.quadraticCurveTo(x, y - 6, x + 8.5, y - 3); ctx.stroke();
    return;
  }
  const ox = x + (olhar.x || 0), oy = y + (olhar.y || 0);
  elipse(ctx, ox, oy, 7.5, tipo === 'triste' ? 8.6 : 9.5); ctx.fillStyle = iris; ctx.fill();
  if (pal.olho) { elipse(ctx, ox, oy + 0.5, 3.8, 6.2); ctx.fillStyle = '#2e2430'; ctx.fill(); }
  ctx.fillStyle = '#fff';
  circulo(ctx, ox + 2.6, oy - 3.6, 3.1); ctx.fill();
  circulo(ctx, ox - 2.4, oy + 3.4, 1.4); ctx.fill();
  if (tipo === 'triste') {
    circulo(ctx, ox, oy + 4.5, 2.4); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();   // olho marejado
    const dentro = -lado;
    ctx.lineWidth = 2.4; linha(ctx, x + dentro * 7, y - 17, x - dentro * 6, y - 13);
  }
}

function boca(ctx, tipo, tr) {
  const y = -74.5;
  ctx.strokeStyle = tr; ctx.lineWidth = 2.3; ctx.lineCap = 'round';
  if (tipo === 'aberta') {
    ctx.beginPath(); ctx.moveTo(-5.5, y - 1); ctx.quadraticCurveTo(0, y + 11, 5.5, y - 1); ctx.closePath();
    ctx.fillStyle = '#e36d80'; ctx.fill(); ctx.stroke();
    elipse(ctx, 0, y + 4.6, 3, 1.8); ctx.fillStyle = '#f7a3b3'; ctx.fill();
    return;
  }
  if (tipo === 'triste') { ctx.beginPath(); ctx.arc(0, y + 5, 4.5, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); return; }
  if (tipo === 'choro') { elipse(ctx, 0, y + 3.5, 5.5, 5); ctx.fillStyle = '#b8505f'; ctx.fill(); ctx.stroke(); return; }
  ctx.beginPath();                                  // ω
  ctx.arc(-3.2, y, 3.2, 0, Math.PI);
  ctx.moveTo(6.4, y); ctx.arc(3.2, y, 3.2, 0, Math.PI);
  ctx.stroke();
}

function rosto(ctx, pal, P) {
  const tr = pal.traco || LINHA;
  for (const l of [-1, 1]) olho(ctx, l * 19, -89, P.olhos, pal, P.olhar, l, tr);
  ctx.fillStyle = `rgba(245,150,172,${0.45 + 0.35 * P.corado})`;
  for (const l of [-1, 1]) { elipse(ctx, l * 34, -76, 7.5, 4.5); ctx.fill(); }
  ctx.fillStyle = ctx.strokeStyle = '#f08da0'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-3.4, -79); ctx.lineTo(3.4, -79); ctx.lineTo(0, -75.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  boca(ctx, P.boca, tr);
}

function gota(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.8);
  ctx.bezierCurveTo(x + r, y - r * 0.5, x + r, y + r, x, y + r);
  ctx.bezierCurveTo(x - r, y + r, x - r, y - r * 0.5, x, y - r * 1.8);
  ctx.fill(); ctx.stroke();
}
function lagrimas(ctx, nivel, t) {
  ctx.save();
  ctx.fillStyle = '#a3d5f5'; ctx.strokeStyle = LINHA; ctx.lineWidth = 1.8;
  if (nivel >= 2) for (const l of [-1, 1]) { ctx.beginPath(); ctx.roundRect(l * 23 - 3, -84, 6, 36, 3); ctx.fill(); ctx.stroke(); }
  const base = ctx.globalAlpha;
  for (const l of [-1, 1]) for (let i = 0; i < nivel; i++) {
    const f = (t * 0.8 + i * 0.5 + (l > 0 ? 0.25 : 0)) % 1;
    ctx.globalAlpha = base * (1 - f * 0.8);
    gota(ctx, l * (27 + f * 5 * nivel), -82 + f * 36, 3.4);
  }
  ctx.restore();
}

function doenca(ctx, nivel) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120,140,190,.75)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for (const x of [-10, 0, 10]) linha(ctx, x, -120, x, -108);         // linhas de desânimo
  ctx.translate(20, -131); ctx.rotate(0.35);                           // bolsa de gelo
  elipse(ctx, 0, 0, 19, 11); contornar(ctx, '#bfe0f5', 2.6);
  ctx.beginPath(); ctx.roundRect(-5, -15, 10, 7, 2); contornar(ctx, '#f6cf5c', 2.2);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#a3d5f5'; ctx.strokeStyle = LINHA; ctx.lineWidth = 1.8;
  gota(ctx, -46, -104, 3.6);                                           // suor
  if (nivel >= 2) {                                                    // termômetro na boca
    ctx.lineCap = 'round';
    ctx.lineWidth = 6.5; ctx.strokeStyle = LINHA; linha(ctx, 3, -72, 22, -63);
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#fffaf4'; linha(ctx, 3, -72, 22, -63);
    circulo(ctx, 22, -63, 3.4); contornar(ctx, '#ef6f7f', 1.8);
  }
  ctx.restore();
}

// ---------- roupinhas ----------
function laco(ctx, x, y, ang, cor) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.lineWidth = 2.6; ctx.strokeStyle = LINHA; ctx.fillStyle = cor;
  for (const l of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(l * 2, 2); ctx.lineTo(l * 9, 14); ctx.lineTo(l * 4, 13); ctx.lineTo(l, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  for (const l of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(l * 6, -12, l * 20, -13, l * 19, -1);
    ctx.bezierCurveTo(l * 18, 9, l * 6, 8, 0, 0);
    ctx.fill(); ctx.stroke();
  }
  circulo(ctx, 0, 0, 4.5); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function flor(ctx, x, y, cor, esc = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(esc, esc);
  ctx.fillStyle = cor; ctx.strokeStyle = LINHA; ctx.lineWidth = 1.8;
  for (let k = 0; k < 5; k++) {
    const a = k * TAU / 5 - Math.PI / 2;
    circulo(ctx, Math.cos(a) * 4.2, Math.sin(a) * 4.2, 3.6); ctx.fill(); ctx.stroke();
  }
  circulo(ctx, 0, 0, 2.8); ctx.fillStyle = '#f6cf5c'; ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function coracao(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  ctx.closePath();
}

const CABECA = {
  'laco-rosa': ctx => laco(ctx, -31, -122, -0.4, '#f49ab0'),
  'chapeu-palha': ctx => {
    elipse(ctx, 0, -123, 55, 11); contornar(ctx, '#f6dc95');
    const cup = new Path2D();
    cup.moveTo(-27, -125); cup.bezierCurveTo(-28, -159, 28, -159, 27, -125); cup.closePath();
    ctx.fillStyle = '#f6dc95'; ctx.fill(cup);
    ctx.save(); ctx.clip(cup); ctx.fillStyle = '#f39db1'; ctx.fillRect(-30, -136, 60, 8); ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = LINHA; ctx.stroke(cup);
    flor(ctx, 19, -132, '#fffaf4', 0.9);
  },
  'gorro': ctx => {
    const p = new Path2D();
    p.moveTo(-41, -118); p.bezierCurveTo(-39, -152, -5, -174, 30, -169);
    p.quadraticCurveTo(53, -166, 61, -150); p.quadraticCurveTo(41, -151, 41, -118); p.closePath();
    ctx.fillStyle = '#bcd6f3'; ctx.fill(p); ctx.lineWidth = 3; ctx.strokeStyle = LINHA; ctx.stroke(p);
    ctx.fillStyle = '#fffaf4';
    for (const [x, y] of [[-18, -140], [6, -155], [22, -138], [-2, -130], [36, -158]]) { circulo(ctx, x, y, 2.4); ctx.fill(); }
    ctx.beginPath(); ctx.roundRect(-45, -127, 90, 15, 7.5); contornar(ctx, '#fffaf4');
    circulo(ctx, 61, -149, 8); contornar(ctx, '#fffaf4');
  },
  'fone': ctx => {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -92, 55, Math.PI * 1.1, Math.PI * 1.9);
    ctx.lineWidth = 10.5; ctx.strokeStyle = LINHA; ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#f7b8c6'; ctx.stroke();
    for (const l of [-1, 1]) { ctx.beginPath(); ctx.roundRect(l * 53 - 7, -107, 14, 27, 6); contornar(ctx, '#f49ab0'); }
  },
  'coroa-flores': ctx => {
    const cores = ['#f7b3c2', '#fbe7a6', '#d9c8f2'];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (1.19 + i * 0.125);
      elipse(ctx, Math.cos(a) * 47, -92 + Math.sin(a) * 40, 5, 2.6, a + Math.PI / 2);
      contornar(ctx, '#b5dea6', 1.6);
    }
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.13 + i * 0.123);
      flor(ctx, Math.cos(a) * 46, -92 + Math.sin(a) * 39, cores[i % 3]);
    }
  },
  'chapeu-chef': ctx => {
    const bolas = [[-17, -141, 14], [17, -141, 14], [0, -151, 17]];
    ctx.lineWidth = 6; ctx.strokeStyle = LINHA;
    for (const [x, y, r] of bolas) { circulo(ctx, x, y, r); ctx.stroke(); }
    ctx.beginPath(); ctx.roundRect(-26, -134, 52, 17, 4); ctx.stroke();
    ctx.fillStyle = '#fffdf8';
    for (const [x, y, r] of bolas) { circulo(ctx, x, y, r); ctx.fill(); }
    ctx.beginPath(); ctx.roundRect(-26, -134, 52, 17, 4); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(90,62,54,.35)';
    for (const x of [-13, 0, 13]) linha(ctx, x, -131, x, -120);
  },
};
const ROSTO = {
  'oculos-redondo': ctx => {
    ctx.strokeStyle = '#8a6450'; ctx.lineWidth = 2.6; ctx.fillStyle = 'rgba(255,255,255,.2)';
    for (const l of [-1, 1]) { circulo(ctx, l * 19, -89, 11.5); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-7.5, -91); ctx.quadraticCurveTo(0, -95, 7.5, -91); ctx.stroke();
    for (const l of [-1, 1]) linha(ctx, l * 30.5, -91, l * 47, -95);
  },
  'oculos-coracao': ctx => {
    ctx.lineWidth = 2.4; ctx.strokeStyle = LINHA; ctx.fillStyle = 'rgba(245,130,160,.78)';
    for (const l of [-1, 1]) { coracao(ctx, l * 19, -88, 11.5); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-6, -92); ctx.quadraticCurveTo(0, -95, 6, -92); ctx.stroke();
    for (const l of [-1, 1]) linha(ctx, l * 32, -92, l * 47, -95);
  },
};
const PESCOCO = {
  'coleira-sino': ctx => {
    const p = new Path2D(); p.moveTo(-25, -52); p.quadraticCurveTo(0, -38, 25, -52);
    ctx.lineCap = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = LINHA; ctx.stroke(p);
    ctx.lineWidth = 5; ctx.strokeStyle = '#f07f96'; ctx.stroke(p);
    circulo(ctx, 0, -40.5, 5.5); contornar(ctx, '#f6cf5c', 2.2);
    ctx.lineWidth = 1.6; linha(ctx, 0, -39.5, 0, -36.5);
  },
  'lenco-azul': ctx => {
    ctx.beginPath(); ctx.moveTo(-27, -52); ctx.quadraticCurveTo(0, -44, 27, -52); ctx.lineTo(0, -24); ctx.closePath();
    contornar(ctx, '#a9cdf0', 2.6);
    ctx.fillStyle = '#fffaf4';
    for (const [x, y] of [[-9, -44], [7, -42], [-1, -34], [14, -47], [-15, -48]]) { circulo(ctx, x, y, 1.9); ctx.fill(); }
  },
  'gravata': ctx => {
    ctx.lineWidth = 2.4; ctx.strokeStyle = LINHA; ctx.fillStyle = '#e8707f';
    for (const l of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(l * 13, -52); ctx.lineTo(l * 13, -37); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    circulo(ctx, 0, -45, 3.8); ctx.fill(); ctx.stroke();
  },
};

// ---------- livro (ele lê enquanto você foca) ----------
function livro(ctx, t) {
  ctx.save(); ctx.translate(0, -40);
  ctx.lineWidth = 2.6; ctx.strokeStyle = LINHA; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(-30, -12); ctx.lineTo(-30, 14); ctx.lineTo(0, 21); ctx.lineTo(30, 14); ctx.lineTo(30, -12); ctx.closePath();
  contornar(ctx, '#a9cdf0', 2.6);
  const pagina = l => { ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(l * 26, -9); ctx.lineTo(l * 26, 11); ctx.lineTo(0, 17); ctx.closePath(); };
  for (const l of [-1, 1]) { pagina(l); contornar(ctx, '#fffdf6', 2.2); }
  ctx.strokeStyle = 'rgba(90,62,54,.3)'; ctx.lineWidth = 1.5;
  for (const l of [-1, 1]) for (let i = 0; i < 3; i++) linha(ctx, l * 5, 3 + i * 5, l * 21, -2 + i * 5);
  const f = (t % 7) / 7;                                    // uma página vira a cada 7 s
  if (f > 0.86) {
    const k = (f - 0.86) / 0.14;
    ctx.save(); ctx.scale(Math.cos(k * Math.PI), 1); pagina(1); contornar(ctx, '#fffdf6', 2.2); ctx.restore();
  }
  ctx.restore();
}

// ---------- fantasminha (quando ele morre vira estrelinha, não algo triste de ver) ----------
function asas(ctx, t) {
  const bate = Math.sin(t * 5) * 0.15;
  for (const l of [-1, 1]) {
    ctx.save(); ctx.translate(l * 30, -54); ctx.rotate(l * (0.3 + bate));
    const p = new Path2D();
    p.moveTo(0, 0); p.bezierCurveTo(l * 30, -26, l * 48, -8, l * 40, 8);
    p.bezierCurveTo(l * 30, 4, l * 28, 14, l * 18, 10); p.bezierCurveTo(l * 14, 16, l * 4, 12, 0, 0);
    parte(ctx, '#fff', p, 2.6);
    ctx.restore();
  }
}
function aureola(ctx, t) {
  ctx.save(); ctx.translate(0, -161 + Math.sin(t * 2) * 2);
  elipse(ctx, 0, 0, 24, 6.5);
  ctx.lineWidth = 7.5; ctx.strokeStyle = LINHA; ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = '#f6d767'; ctx.stroke();
  ctx.restore();
}

// ---------- montagem ----------
const PADRAO = {
  olhos: 'aberto', boca: 'w', orelhas: 0, twitch: 0, cauda: 0, patas: 'baixo', olhar: { x: 0, y: 0 },
  rot: 0, sx: 1, sy: 1, dx: 0, dy: 0, cabecaRot: 0, cabecaDy: 0, lagrimas: 0, livro: false, fantasma: false, doente: 0, corado: 0,
};

// g = { cor, pelo, roupas: { cabeca, rosto, pescoco, corpo } }
export function desenharGato(ctx, g, pose = {}, t = 0) {
  const pal = PELAGENS[g.cor] || PELAGENS.laranja;
  const F = formas(g.pelo || 'curto');
  const P = { ...PADRAO, ...pose };
  const r = g.roupas || {};
  ctx.save();
  ctx.translate(P.dx, P.dy);
  ctx.scale(P.sx, P.sy);
  if (P.rot) { ctx.translate(0, -70); ctx.rotate(P.rot); ctx.translate(0, 70); }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (P.fantasma) asas(ctx, t);
  cauda(ctx, pal, g.pelo, P.cauda);
  patasTraseiras(ctx, pal);
  corpo(ctx, pal, F, g.pelo, r.corpo);
  if (PESCOCO[r.pescoco]) { ctx.save(); PESCOCO[r.pescoco](ctx); ctx.restore(); }
  if (!P.livro) patas(ctx, pal, P.patas);

  ctx.save();                                                 // a cabeça gira em volta do pescoço
  ctx.translate(0, PESCOCO_Y + P.cabecaDy); ctx.rotate(P.cabecaRot); ctx.translate(0, -PESCOCO_Y);
  orelha(ctx, -1, pal, corOrelha(pal, -1), P.orelhas, 0, g.pelo);
  orelha(ctx, 1, pal, corOrelha(pal, 1), P.orelhas, P.twitch, g.pelo);
  cabeca(ctx, pal, F);
  rosto(ctx, pal, P);
  if (P.lagrimas) lagrimas(ctx, P.lagrimas, t);
  if (P.doente) doenca(ctx, P.doente);
  if (ROSTO[r.rosto]) { ctx.save(); ROSTO[r.rosto](ctx); ctx.restore(); }
  if (CABECA[r.cabeca]) { ctx.save(); CABECA[r.cabeca](ctx); ctx.restore(); }
  if (P.fantasma) aureola(ctx, t);
  ctx.restore();

  if (P.livro) { livro(ctx, t); patas(ctx, pal, 'livro'); }
  ctx.restore();
}
