// O quarto visto de frente, como uma casa de boneca cortada ao meio (resposta 2 da Bianca).
// Cada móvel é uma função que desenha em coordenadas do quarto (400 × 460) no lugar fixo
// do seu slot. A mesma função desenha a miniatura da loja, só que escalada.
import { LINHA, coracao } from './gato.js';
import { porId } from './catalogo.js';

export const W = 400, H = 460, CHAO = 326;
const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function elipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); }
function circulo(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function linha(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function contornar(ctx, cor, lw = 3) { ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = LINHA; ctx.stroke(); }

// Céu pela hora de verdade: de dia azul, fim de tarde pêssego, de noite estrelas.
export function ceu(hora) {
  if (hora >= 6 && hora < 17) return { a: '#bfe3f7', b: '#eaf7fc', noite: false };
  if (hora >= 17 && hora < 19) return { a: '#f7c1b6', b: '#fde8cf', noite: false };
  return { a: '#414c7c', b: '#6d71a5', noite: true };
}

export function desenharParede(ctx, p, x, y, w, h, esc = 1) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = p.base; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = p.cor2;
  if (p.padrao === 'listras') {
    for (let i = x + 12 * esc; i < x + w; i += 34 * esc) ctx.fillRect(i, y, 13 * esc, h);
  } else if (p.padrao === 'bolinhas' || p.padrao === 'coracoes') {
    let fila = 0;
    for (let j = y + 16 * esc; j < y + h + 10; j += 30 * esc, fila++)
      for (let i = x + (fila % 2 ? 26 : 9) * esc; i < x + w + 10; i += 34 * esc) {
        if (p.padrao === 'bolinhas') circulo(ctx, i, j, 4.5 * esc); else coracao(ctx, i, j, 5.5 * esc);
        ctx.fill();
      }
  }
  ctx.restore();
}

function chao(ctx, ext) {
  const x0 = -ext.dx, x1 = W + ext.dx, fim = H + (ext.baixo || 0);
  ctx.fillStyle = '#f1d9b5'; ctx.fillRect(x0, CHAO, x1 - x0, fim - CHAO);
  ctx.strokeStyle = 'rgba(90,62,54,.15)'; ctx.lineWidth = 2;
  // tábuas cada vez mais largas para a frente (perspectiva); continuam por trás dos botões
  const faixas = [CHAO, CHAO + 30, CHAO + 66, CHAO + 106];
  for (let y = CHAO + 150, larg = 46; y < fim + larg; y += larg, larg += 4) faixas.push(y);
  faixas.push(fim + 60);
  for (const y of faixas.slice(1, -1)) linha(ctx, x0, y, x1, y);
  const inicios = [70, 150, 44, 118];
  faixas.slice(0, -1).forEach((y0, k) => {                        // emendas das tábuas, desencontradas
    const ini = inicios[k % 4];
    for (let x = ini - 170 * Math.ceil((ini - x0) / 170); x < x1; x += 170) linha(ctx, x, y0, x, faixas[k + 1]);
  });
  ctx.fillStyle = '#fff6ea'; ctx.fillRect(x0, CHAO - 12, x1 - x0, 12);                 // rodapé
  ctx.strokeStyle = LINHA; ctx.lineWidth = 2.5;
  linha(ctx, x0, CHAO - 12, x1, CHAO - 12); linha(ctx, x0, CHAO, x1, CHAO);
}

// ---------- janela ----------
function nuvem(ctx, x, y, s) {
  ctx.fillStyle = '#fff';
  for (const [dx, dy, r] of [[0, 0, 9], [11, -5, 11], [23, 0, 9], [11, 3, 8]]) { circulo(ctx, x + dx * s, y + dy * s, r * s); ctx.fill(); }
}
function vidro(ctx, forma, box, t, c) {
  const [x, y, w, h] = box;
  ctx.save();
  forma();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c.a); g.addColorStop(1, c.b);
  ctx.fillStyle = g; ctx.fill();
  ctx.clip();
  if (c.noite) {
    ctx.fillStyle = '#fff7d6';
    [[0.15, 0.2], [0.72, 0.14], [0.4, 0.4], [0.85, 0.55], [0.25, 0.7], [0.6, 0.78]].forEach(([fx, fy], i) => {
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 2 + i * 1.7);
      circulo(ctx, x + fx * w, y + fy * h, 1.6); ctx.fill();
    });
    ctx.globalAlpha = 1;
    circulo(ctx, x + w * 0.66, y + h * 0.32, 12); contornar(ctx, '#fff2c2', 2);
  } else {
    const d = (t * 5) % (w + 70);
    nuvem(ctx, x - 40 + d, y + h * 0.3, 0.9);
    nuvem(ctx, x - 40 + ((d + w * 0.6) % (w + 70)), y + h * 0.65, 0.7);
  }
  ctx.restore();
  forma(); ctx.lineWidth = 2.5; ctx.strokeStyle = LINHA; ctx.stroke();
}
function janelaSimples(ctx, t, c) {
  rr(ctx, 142, 50, 116, 124, 14); contornar(ctx, '#fffaf2');
  vidro(ctx, () => rr(ctx, 152, 60, 96, 104, 9), [152, 60, 96, 104], t, c);
  ctx.fillStyle = '#fffaf2'; ctx.fillRect(197, 60, 6, 104); ctx.fillRect(152, 109, 96, 6);
  ctx.lineWidth = 2; ctx.strokeStyle = LINHA; ctx.strokeRect(197, 60, 6, 104); ctx.strokeRect(152, 109, 96, 6);
  rr(ctx, 134, 170, 132, 11, 5); contornar(ctx, '#fffaf2');
}
function janelaRedonda(ctx, t, c) {
  circulo(ctx, 200, 112, 62); contornar(ctx, '#fffaf2');
  vidro(ctx, () => circulo(ctx, 200, 112, 51), [149, 61, 102, 102], t, c);
  ctx.fillStyle = '#fffaf2'; ctx.fillRect(197, 61, 6, 102); ctx.fillRect(149, 109, 102, 6);
  ctx.lineWidth = 2; ctx.strokeStyle = LINHA; ctx.strokeRect(197, 61, 6, 102); ctx.strokeRect(149, 109, 102, 6);
  circulo(ctx, 200, 112, 51); ctx.lineWidth = 2.5; ctx.stroke();
}
function cortina(cor, dobra) {
  return (ctx, t, c) => {
    janelaSimples(ctx, t, c);
    ctx.lineCap = 'round';
    ctx.lineWidth = 8; ctx.strokeStyle = LINHA; linha(ctx, 120, 44, 280, 44);
    ctx.lineWidth = 4; ctx.strokeStyle = '#e7c39c'; linha(ctx, 120, 44, 280, 44);
    for (const l of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(200 + l * 82, 46); ctx.lineTo(200 + l * 38, 46);
      ctx.quadraticCurveTo(200 + l * 54, 110, 200 + l * 42, 150);
      ctx.quadraticCurveTo(200 + l * 52, 170, 200 + l * 46, 188);
      ctx.lineTo(200 + l * 84, 188); ctx.closePath();
      contornar(ctx, cor, 2.8);
      ctx.strokeStyle = dobra; ctx.lineWidth = 2.2;
      linha(ctx, 200 + l * 70, 52, 200 + l * 72, 182); linha(ctx, 200 + l * 58, 52, 200 + l * 57, 140);
      rr(ctx, 200 + l * 46 - 9, 146, 18, 8, 4); contornar(ctx, dobra, 2);
    }
    for (const x of [120, 280]) { circulo(ctx, x, 44, 5.5); contornar(ctx, '#e7c39c', 2.4); }
  };
}

// ---------- parede ----------
function quadroMoldura(ctx, corMoldura, conteudo) {
  ctx.save(); ctx.translate(66, 96); ctx.rotate(-0.04);
  rr(ctx, -37, -31, 74, 62, 7); contornar(ctx, corMoldura);
  ctx.save(); rr(ctx, -28, -22, 56, 44, 3); ctx.clip(); conteudo(); ctx.restore();
  rr(ctx, -28, -22, 56, 44, 3); ctx.lineWidth = 2; ctx.strokeStyle = LINHA; ctx.stroke();
  ctx.restore();
}
const quadroPaisagem = ctx => quadroMoldura(ctx, '#f6d7a8', () => {
  ctx.fillStyle = '#d9eef9'; ctx.fillRect(-30, -24, 60, 48);
  circulo(ctx, 14, -9, 7); ctx.fillStyle = '#fbe08a'; ctx.fill();
  elipse(ctx, -12, 22, 40, 20); ctx.fillStyle = '#bfe3b0'; ctx.fill();
  elipse(ctx, 20, 27, 34, 18); ctx.fillStyle = '#a5d69a'; ctx.fill();
});
const quadroPeixe = ctx => quadroMoldura(ctx, '#e4d9f4', () => {
  ctx.fillStyle = '#fdf1f4'; ctx.fillRect(-30, -24, 60, 48);
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(22, -9); ctx.lineTo(22, 9); ctx.closePath(); contornar(ctx, '#f7b97a', 2);
  elipse(ctx, -2, 0, 15, 10); contornar(ctx, '#f7b97a', 2);
  circulo(ctx, -9, -2, 1.8); ctx.fillStyle = LINHA; ctx.fill();
  ctx.strokeStyle = '#a9cdf0'; ctx.lineWidth = 1.6;
  for (const [x, y, r] of [[-20, -12, 2.5], [-16, -18, 1.8]]) { circulo(ctx, x, y, r); ctx.stroke(); }
});

function prateleira(ctx) {
  for (const x of [296, 356]) { ctx.beginPath(); ctx.moveTo(x, 156); ctx.lineTo(x + 9, 156); ctx.lineTo(x, 171); ctx.closePath(); contornar(ctx, '#e7c39c', 2); }
  const livros = [[289, 23, '#f7b3c2'], [299, 27, '#a9cdf0'], [309, 21, '#fbe7a6']];
  for (const [x, h, cor] of livros) { rr(ctx, x, 147 - h, 9, h, 2); contornar(ctx, cor, 2); }
  ctx.save(); ctx.translate(322, 147); ctx.rotate(0.35); rr(ctx, 0, -22, 9, 22, 2); contornar(ctx, '#c9b6ec', 2); ctx.restore();
  for (const [dx, a] of [[-6, -0.5], [0, 0], [6, 0.5]]) { elipse(ctx, 353 + dx, 124, 4, 9, a); contornar(ctx, '#9fd39a', 2); }
  ctx.beginPath(); ctx.moveTo(344, 132); ctx.lineTo(362, 132); ctx.lineTo(359, 147); ctx.lineTo(347, 147); ctx.closePath(); contornar(ctx, '#f2b8a2', 2);
  rr(ctx, 280, 147, 92, 10, 4); contornar(ctx, '#e7c39c', 2.5);
}

function lustre(ctx, t, c) {
  if (c.noite) brilho(ctx, 305, 70, 120);
  ctx.lineWidth = 2.5; ctx.strokeStyle = LINHA; linha(ctx, 305, -400, 305, 40);   // fio vem do teto, seja qual for a altura
  ctx.beginPath(); ctx.moveTo(281, 62); ctx.bezierCurveTo(281, 34, 329, 34, 329, 62); ctx.closePath(); contornar(ctx, '#f9cdd8');
  circulo(ctx, 305, 66, 5.5); contornar(ctx, '#fff3b0', 2);
}

// ---------- chão ----------
const CORES_LIVRO = ['#f7b3c2', '#a9cdf0', '#fbe7a6', '#c9b6ec', '#b5dea6', '#f6c29a'];
function estante(ctx) {
  rr(ctx, 20, 176, 86, 152, 8); contornar(ctx, '#e9c49e');
  rr(ctx, 28, 184, 70, 136, 4); ctx.fillStyle = '#d9b08a'; ctx.fill();
  let k = 0;
  const fileira = (base, alturas) => {
    let x = 31;
    for (const h of alturas) { const w = 8 + (k % 3) * 1.5; rr(ctx, x, base - h, w, h, 2); contornar(ctx, CORES_LIVRO[k++ % 6], 2); x += w + 1; }
    return x;
  };
  const x1 = fileira(226, [34, 38, 30, 36, 33, 28]);
  ctx.save(); ctx.translate(x1 + 2, 226); ctx.rotate(0.3); rr(ctx, 0, -30, 9, 30, 2); contornar(ctx, '#f7b3c2', 2); ctx.restore();
  fileira(272, [36, 32, 38]);
  ctx.beginPath(); ctx.moveTo(74, 258); ctx.lineTo(92, 258); ctx.lineTo(89, 272); ctx.lineTo(77, 272); ctx.closePath(); contornar(ctx, '#f2b8a2', 2);
  for (const [dx, a] of [[-5, -0.5], [0, 0], [5, 0.5]]) { elipse(ctx, 83 + dx, 250, 3.5, 8, a); contornar(ctx, '#9fd39a', 1.8); }
  for (let i = 0; i < 4; i++) { rr(ctx, 34 + (i % 2) * 3, 310 - i * 9, 42, 9, 2); contornar(ctx, CORES_LIVRO[(i + 2) % 6], 2); }
  for (const y of [226, 272]) { rr(ctx, 26, y, 74, 6, 2); contornar(ctx, '#e9c49e', 2); }
}
function planta(ctx, t) {
  const balanco = Math.sin(t * 1.3) * 0.04;
  for (const [a, len] of [[-0.9, 42], [-0.45, 54], [0, 60], [0.45, 52], [0.9, 40]]) {
    ctx.save(); ctx.translate(132, 294); ctx.rotate(a + balanco);
    elipse(ctx, 0, -len / 2, len * 0.22, len / 2); contornar(ctx, '#9fd39a', 2.4);
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(90,62,54,.45)'; linha(ctx, 0, -4, 0, -len + 8);
    ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(115, 300); ctx.lineTo(149, 300); ctx.lineTo(144, 330); ctx.lineTo(120, 330); ctx.closePath(); contornar(ctx, '#f2b8a2');
  rr(ctx, 111, 293, 42, 10, 4); contornar(ctx, '#f6c9b6', 2.5);
}
function abajur(ctx, t, c) {
  if (c.noite) brilho(ctx, 359, 250, 110);
  rr(ctx, 356, 244, 6, 84, 2); contornar(ctx, '#e7c39c', 2);
  elipse(ctx, 359, 328, 17, 5.5); contornar(ctx, '#f6c29a', 2.4);
  ctx.beginPath(); ctx.moveTo(337, 249); ctx.lineTo(381, 249); ctx.lineTo(372, 214); ctx.lineTo(346, 214); ctx.closePath(); contornar(ctx, '#fbe3a6');
}
function camaSimples(ctx) {
  elipse(ctx, 318, 344, 56, 21); contornar(ctx, '#f7c6d2');
  elipse(ctx, 318, 337, 41, 12); contornar(ctx, '#fde6ec', 2.5);
}
function camaNuvem(ctx) {
  const bolas = [[282, 346, 18], [301, 334, 22], [333, 333, 22], [354, 346, 18], [318, 352, 24]];
  ctx.lineWidth = 6; ctx.strokeStyle = LINHA;
  for (const [x, y, r] of bolas) { circulo(ctx, x, y, r); ctx.stroke(); }
  ctx.fillStyle = '#eef0fb';
  for (const [x, y, r] of bolas) { circulo(ctx, x, y, r); ctx.fill(); }
  elipse(ctx, 318, 340, 34, 9); contornar(ctx, '#d3e5f6', 2);
}
function tapeteRedondo(ctx) {
  elipse(ctx, 200, 426, 110, 24); contornar(ctx, '#cfe6d0');
  ctx.save(); ctx.setLineDash([7, 7]); elipse(ctx, 200, 426, 92, 17); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fffaf2'; ctx.stroke(); ctx.restore();
}
function tapeteCoracao(ctx) {
  ctx.save(); ctx.translate(200, 424); ctx.scale(1, 0.3); coracao(ctx, 0, -10, 92); ctx.restore();
  contornar(ctx, '#f7c6d2');
}
function caixaAreia(cor, borda, enfeite) {
  return (ctx, t, c, info) => {
    rr(ctx, 30, 400, 108, 16, 8); contornar(ctx, borda, 2.6);
    rr(ctx, 38, 403, 92, 9, 4); ctx.fillStyle = '#f3e2bd'; ctx.fill();
    if (info?.suja) for (const [x, y] of [[58, 407], [92, 406], [112, 408]]) { elipse(ctx, x, y, 5, 3); contornar(ctx, '#b69a7a', 1.6); }
    rr(ctx, 34, 410, 100, 34, 9); contornar(ctx, cor);
    if (enfeite) enfeite(ctx);
  };
}
function patinha(ctx, x, y, cor) {
  ctx.fillStyle = cor;
  elipse(ctx, x, y + 2, 6, 4.6); ctx.fill();
  for (const [dx, dy] of [[-6, -4], [-2, -7], [2, -7], [6, -4]]) { circulo(ctx, x + dx, y + dy, 2.2); ctx.fill(); }
}
function casinhaAreia(ctx, t, c, info) {
  rr(ctx, 34, 374, 100, 70, 8); contornar(ctx, '#fbe7a6');
  ctx.beginPath(); ctx.moveTo(24, 380); ctx.lineTo(84, 340); ctx.lineTo(144, 380); ctx.closePath(); contornar(ctx, '#f4a7b9');
  coracao(ctx, 84, 364, 6); ctx.fillStyle = '#fffaf2'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(64, 444); ctx.lineTo(64, 414); ctx.arc(84, 414, 20, Math.PI, 0); ctx.lineTo(104, 444); ctx.closePath(); contornar(ctx, '#7b5f55', 2.6);
  if (info?.suja) { elipse(ctx, 84, 440, 8, 3); ctx.fillStyle = '#b69a7a'; ctx.fill(); }
}

function brilho(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x, y, 4, x, y, r);
  g.addColorStop(0, 'rgba(255,230,160,.55)'); g.addColorStop(1, 'rgba(255,230,160,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export const MOVEL = {
  'janela-simples': janelaSimples, 'janela-redonda': janelaRedonda,
  'cortina-rosa': cortina('#f7c6d2', '#ef9fb3'), 'cortina-lilas': cortina('#e4d9f4', '#c9b6ec'),
  'quadro-paisagem': quadroPaisagem, 'quadro-peixe': quadroPeixe,
  'prateleira-simples': prateleira, 'lustre': lustre,
  'estante-livros': estante, 'planta': planta, 'abajur': abajur,
  'cama-simples': camaSimples, 'cama-nuvem': camaNuvem,
  'tapete-redondo': tapeteRedondo, 'tapete-coracao': tapeteCoracao,
  'areia-basica': caixaAreia('#b9d8ea', '#cfe4f0'),
  'areia-rosa': caixaAreia('#f7c6d2', '#fde0e7', ctx => patinha(ctx, 84, 429, '#ef9fb3')),
  'areia-casinha': casinhaAreia,
};
// Caixa de cada móvel em coordenadas do quarto: serve para a miniatura e para o toque.
const CAIXA = {
  'janela-simples': [132, 44, 136, 140], 'janela-redonda': [134, 46, 132, 132],
  'cortina-rosa': [114, 36, 172, 156], 'cortina-lilas': [114, 36, 172, 156],
  'quadro-paisagem': [26, 62, 80, 68], 'quadro-peixe': [26, 62, 80, 68],
  'prateleira-simples': [276, 112, 100, 62], 'lustre': [276, 0, 58, 76],
  'estante-livros': [16, 172, 94, 160], 'planta': [96, 230, 72, 104], 'abajur': [332, 208, 54, 126],
  'cama-simples': [258, 318, 120, 50], 'cama-nuvem': [258, 306, 120, 66],
  'tapete-redondo': [86, 398, 228, 56], 'tapete-coracao': [100, 392, 200, 66],
  'areia-basica': [26, 396, 116, 52], 'areia-rosa': [26, 396, 116, 52], 'areia-casinha': [20, 336, 128, 112],
};
export const caixaDe = id => CAIXA[id];
export const CAIXA_TIGELA = [250, 416, 68, 40];

// O quarto foi desenhado com 400 × 460, mas estica para ocupar a tela inteira (pedido da Bianca).
// ext = { dx, dy }: quanto sobra de cada lado e em cima. Cada slot se prende a uma parede:
// o da esquerda acompanha a parede esquerda, o da direita a direita; o que fica na parede sobe
// um pouco quando o quarto fica mais alto, e o lustre continua pendurado no teto.
const ANCORA = {
  janela: [0, -0.4], quadro: [-1, -0.4], prateleira: [1, -0.4], lustre: [1, -1],
  estante: [-1, 0], planta: [-1, 0], abajur: [1, 0], cama: [1, 0], tapete: [0, 0], areia: [-1, 0],
};
export const SEM_EXTRA = { dx: 0, dy: 0 };
export function deslocamento(slot, ext) {
  const [ax, ay] = ANCORA[slot] || [0, 0];
  // as pílulas de moedas/nível ficam no alto do quarto: com o teto alto, o lustre desce para não sumir atrás delas
  const folgaHud = slot === 'lustre' ? Math.min(ext.dy, 40) : 0;
  return [ax * ext.dx, ay * ext.dy + folgaHud];
}
export function caixaNoQuarto(id, ext) {
  const it = porId(id), [x, y, w, h] = CAIXA[id], [ox, oy] = deslocamento(it.slot, ext);
  return [x + ox, y + oy, w, h];
}
// (Bianca, 2026-10-27) Sem moldura: o quarto vai de ponta a ponta, sem borda, sombra nem canto redondo.
// MOLDURA = true volta à maquete com borda marrom.
const MOLDURA = false;
const RAIO = MOLDURA ? 26 : 0;
const contornoQuarto = ext => MOLDURA
  ? [8 - ext.dx, 8 - ext.dy, W + 2 * ext.dx - 16, H + ext.dy - 16]
  : [-ext.dx, -ext.dy, W + 2 * ext.dx, H + ext.dy + (ext.baixo || 0)];

// ordem de trás para a frente
const ORDEM = ['janela', 'quadro', 'prateleira', 'lustre', 'estante', 'planta', 'abajur', 'cama', 'tapete', 'areia'];

export function desenharQuarto(ctx, vis, t, c, ext = SEM_EXTRA) {
  const [x, y, w, h] = contornoQuarto(ext);
  if (MOLDURA) { ctx.fillStyle = 'rgba(90,62,54,.13)'; rr(ctx, x, y + 7, w, h, RAIO); ctx.fill(); }   // sombra de maquete
  ctx.save();
  rr(ctx, x, y, w, h, RAIO); ctx.clip();
  desenharParede(ctx, porId(vis.usando.parede) || porId('parede-creme'), -ext.dx, -ext.dy, W + 2 * ext.dx, CHAO + ext.dy);
  chao(ctx, ext);
  if (!c.noite) {                                                                       // luz da janela no chão
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath(); ctx.moveTo(152, CHAO); ctx.lineTo(248, CHAO); ctx.lineTo(292, 408); ctx.lineTo(172, 408); ctx.closePath(); ctx.fill();
  }
  for (const slot of ORDEM) {
    const id = vis.usando[slot];
    if (!MOVEL[id]) continue;
    const [ox, oy] = deslocamento(slot, ext);
    ctx.save(); ctx.translate(ox, oy); MOVEL[id](ctx, t, c, vis); ctx.restore();
  }
  ctx.restore();
}

export function desenharNoite(ctx, vis, c, ext = SEM_EXTRA) {
  const [x, y, w, h] = contornoQuarto(ext);
  ctx.save();
  rr(ctx, x, y, w, h, RAIO); ctx.clip();
  ctx.fillStyle = 'rgba(45,45,100,.16)'; ctx.fillRect(x, y, w, h);
  const [ax, ay] = deslocamento('abajur', ext), [lx, ly] = deslocamento('lustre', ext);
  if (vis.usando.abajur) brilho(ctx, 359 + ax, 250 + ay, 130);
  if (vis.usando.lustre) brilho(ctx, 305 + lx, 70 + ly, 140);
  ctx.restore();
}

export function desenharMoldura(ctx, ext = SEM_EXTRA) {
  if (!MOLDURA) return;
  const [x, y, w, h] = contornoQuarto(ext);
  rr(ctx, x, y, w, h, RAIO); ctx.lineWidth = 4; ctx.strokeStyle = LINHA; ctx.stroke();
}

export function desenharTigela(ctx, comida) {
  const x = 284, y = 434;
  elipse(ctx, x, y - 2, 27, 6); contornar(ctx, '#fbd0da', 2.5);
  if (comida) {
    ctx.font = '26px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(comida.icone, x, y + 4);
  }
  ctx.beginPath(); ctx.moveTo(x - 27, y - 2); ctx.lineTo(x + 27, y - 2);
  ctx.quadraticCurveTo(x + 23, y + 16, x, y + 16); ctx.quadraticCurveTo(x - 23, y + 16, x - 27, y - 2); ctx.closePath();
  contornar(ctx, '#f49ab0', 2.6);
  patinha(ctx, x, y + 7, '#fbd0da');
}

// Miniatura para a loja: o mesmo desenho do quarto, recortado e escalado.
export function miniatura(ctx, it, lado, t = 0) {
  if (it.slot === 'parede') {
    desenharParede(ctx, it, 0, 0, lado, lado, lado / 110);
    ctx.fillStyle = '#f1d9b5'; ctx.fillRect(0, lado * 0.78, lado, lado * 0.22);
    ctx.lineWidth = 2; ctx.strokeStyle = LINHA; linha(ctx, 0, lado * 0.78, lado, lado * 0.78);
    return;
  }
  const cx = CAIXA[it.id];
  if (!cx || !MOVEL[it.id]) return;
  const [x, y, w, h] = cx;
  const e = Math.min(lado / w, lado / h) * 0.92;
  ctx.save();
  ctx.translate(lado / 2, lado / 2); ctx.scale(e, e); ctx.translate(-(x + w / 2), -(y + h / 2));
  MOVEL[it.id](ctx, t, ceu(12), { suja: false });
  ctx.restore();
}
