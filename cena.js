// Monta a tela: quarto + gatinho + partículas + balão de fala. Cuida das animações e reações.
// Não lê o estado do jogo direto: a cada quadro o app entrega uma "visão" pronta.
import { desenharGato, LINHA, coracao } from './gato.js';
import { W, H, ceu, desenharQuarto, desenharNoite, desenharMoldura, desenharTigela, caixaNoQuarto, CAIXA_TIGELA } from './quarto.js';

const GX = 200, GY = 432, GE = 1.3;                 // onde o gato fica e o tamanho dele no quarto
const TAU = Math.PI * 2;
const DUR = { comer: 1.5, ronronar: 2.8, giro: 1.9, danca: 3.4, carinho: 1.4, festa: 2.1, limpar: 1.2 };
const CORES = ['#f7b3c2', '#a9cdf0', '#fbe7a6', '#c9b6ec', '#b5dea6', '#f6c29a'];

const dentro = (x, y, [bx, by, bw, bh]) => x >= bx && x <= bx + bw && y >= by && y <= by + bh;
const ao = (a, b) => a + Math.random() * (b - a);

export function criarCena(canvas) {
  const ctx = canvas.getContext('2d');
  const fora = document.createElement('canvas');      // o fantasminha é desenhado aqui e colado translúcido
  const fctx = fora.getContext('2d');
  let dpr = 1, escala = 1, tAgora = 0, visAtual = null;
  let WL = W, HL = H, ext = { dx: 0, dy: 0 };          // tamanho lógico real do quarto (estica com a tela)
  let acao = null, parts = [], fala = null, tigela = null;
  const piscar = { prox: 2, ate: 0 }, orelha = { prox: 6, ate: 0 };
  let proxCoracao = 5, proxFedor = 0;

  // larg × alt em pixels de CSS; wl × hl = tamanho lógico (no mínimo 400 × 460, o desenho original).
  function redimensionar(larg, alt, wl = W, hl = H) {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.style.width = larg + 'px'; canvas.style.height = alt + 'px';
    canvas.width = fora.width = Math.round(larg * dpr);
    canvas.height = fora.height = Math.round(alt * dpr);
    WL = wl; HL = hl; escala = larg / WL;
    ext = { dx: (WL - W) / 2, dy: HL - H };
  }

  // ---------- partículas ----------
  function soltar(tipo, x, y, extra = {}) {
    parts.push({ tipo, x, y, vx: 0, vy: 0, g: 0, ini: tAgora, vida: 1.6, rot: 0, vr: 0, s: 1, ...extra });
  }
  const topoCabeca = () => GY - 150 * GE;
  function coracaozinho(x = ao(170, 230), y = topoCabeca() + 20) { soltar('coracao', x, y, { vy: -38, vida: 1.5, s: ao(0.8, 1.2), fase: ao(0, 6) }); }
  function nota() { const l = Math.random() < 0.5 ? -1 : 1; soltar('nota', GX + l * ao(55, 85), ao(290, 340), { vy: -40, vx: l * 12, vida: 1.6, txt: Math.random() < 0.5 ? '♪' : '♫', cor: CORES[(Math.random() * 6) | 0] }); }
  function brilhos(x, y, n = 8, raio = 60) {
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + ao(-0.2, 0.2); soltar('brilho', x, y, { vx: Math.cos(a) * raio, vy: Math.sin(a) * raio * 0.6, vida: 0.8, s: ao(0.7, 1.2) }); }
  }
  function confete(n = 34) {
    for (let i = 0; i < n; i++) soltar('confete', ao(30 - ext.dx, W + ext.dx - 30), ao(-10 - ext.dy, 40 - ext.dy), { vx: ao(-30, 30), vy: ao(20, 80), g: 60, vida: 2.6, rot: ao(0, 6), vr: ao(-6, 6), cor: CORES[i % 6] });
  }
  function moedinha(n) {
    soltar('moeda', GX, topoCabeca() + 10, { vy: -45, vida: 1.8, txt: `+${n}` });
  }

  function emitir(vis, t, dt) {
    const chance = taxa => Math.random() < dt * taxa;
    if (acao) {
      const a = acao, k = (t - a.ini) / a.dur;
      if (a.tipo === 'ronronar' && chance(3.2)) coracaozinho();
      if (a.tipo === 'carinho' && chance(2.2)) coracaozinho();
      if (a.tipo === 'danca' && chance(4)) nota();
      if (a.tipo === 'festa' && chance(5)) brilhos(ao(120, 280), ao(220, 330), 3, 40);
      if (a.tipo === 'giro' && !a.pousou && k > 0.8) { a.pousou = true; brilhos(GX, GY - 10, 10, 90); }
    }
    if (vis.humor === 'feliz' && !acao && t > proxCoracao) { coracaozinho(); proxCoracao = t + ao(6, 10); }
    if (vis.suja && t > proxFedor) {
      const [bx, by, bw] = caixaNoQuarto(vis.usando.areia, ext);
      soltar('fedor', bx + ao(bw * 0.25, bw * 0.75), by + 6, { vy: -22, vida: 1.8, fase: ao(0, 6) });
      proxFedor = t + 0.9;
    }
  }

  function desenharParticulas(t, dt) {
    parts = parts.filter(p => t - p.ini < p.vida);
    for (const p of parts) {
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const k = (t - p.ini) / p.vida, alfa = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      ctx.save(); ctx.globalAlpha = alfa; ctx.translate(p.x, p.y);
      ctx.lineWidth = 2; ctx.strokeStyle = LINHA; ctx.lineJoin = 'round';
      switch (p.tipo) {
        case 'coracao':
          ctx.translate(Math.sin(t * 3 + p.fase) * 5, 0); ctx.scale(p.s, p.s);
          coracao(ctx, 0, 0, 8); ctx.fillStyle = '#f58fa8'; ctx.fill(); ctx.stroke(); break;
        case 'nota':
          ctx.font = '600 22px Fredoka, sans-serif'; ctx.textAlign = 'center';
          ctx.lineWidth = 4; ctx.strokeText(p.txt, 0, 0); ctx.fillStyle = p.cor; ctx.fillText(p.txt, 0, 0); break;
        case 'brilho': {
          ctx.scale(p.s, p.s); ctx.beginPath();
          for (let i = 0; i < 8; i++) { const r = i % 2 ? 2.6 : 8, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
          ctx.closePath(); ctx.fillStyle = '#f9d86b'; ctx.fill(); ctx.stroke(); break;
        }
        case 'confete':
          ctx.rotate(p.rot); ctx.fillStyle = p.cor; ctx.fillRect(-4, -2.5, 8, 5); ctx.lineWidth = 1.2; ctx.strokeRect(-4, -2.5, 8, 5); break;
        case 'fedor':
          ctx.strokeStyle = 'rgba(150,170,110,.8)'; ctx.lineWidth = 2.4; ctx.beginPath();
          for (let i = 0; i <= 10; i++) { const yy = -i * 2.2; ctx.lineTo(Math.sin(i * 0.9 + t * 4 + p.fase) * 4, yy); }
          ctx.stroke(); break;
        case 'moeda':
          ctx.beginPath(); ctx.arc(-12, 0, 11, 0, TAU); ctx.fillStyle = '#f6cf5c'; ctx.fill(); ctx.lineWidth = 2.4; ctx.stroke();
          ctx.beginPath(); ctx.arc(-12, 0, 6.5, 0, TAU); ctx.strokeStyle = '#e0a93a'; ctx.lineWidth = 1.6; ctx.stroke();
          ctx.font = '600 20px Fredoka, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 4; ctx.strokeStyle = '#fffaf3'; ctx.strokeText(p.txt, 3, 1); ctx.fillStyle = LINHA; ctx.fillText(p.txt, 3, 1); break;
      }
      ctx.restore();
    }
  }

  // ---------- pose ----------
  function pose(vis, t) {
    const r = Math.sin(t * 2.2);
    const p = { olhar: { x: 0, y: 0 }, cauda: Math.sin(t * 1.7) * 0.8, sy: 1 + r * 0.012, sx: 1 - r * 0.008 };
    const h = vis.humor;
    const lendo = vis.fase === 'foco' && !['morto', 'doente', 'grave'].includes(h);
    if (lendo) { p.livro = true; p.olhar = { x: Math.sin(t * 0.6) * 1.8, y: 2.5 }; }
    switch (h) {
      case 'feliz': p.corado = 0.3; break;
      case 'triste': Object.assign(p, { olhos: 'triste', boca: 'triste', orelhas: 0.45 }); break;
      case 'fome': Object.assign(p, { orelhas: 0.25 }); if (!lendo) p.olhar = { x: 3, y: 2 }; break;
      case 'chora': Object.assign(p, { olhos: 'triste', boca: 'triste', orelhas: 0.7, lagrimas: 1 }); break;
      case 'choraMuito': Object.assign(p, { olhos: 'aperto', boca: 'choro', orelhas: 1, lagrimas: 2, dx: Math.sin(t * 28) * 0.7 }); break;
      case 'doente': Object.assign(p, { olhos: 'doente', boca: 'triste', orelhas: 0.6, doente: 1, cauda: Math.sin(t * 0.8) * 0.3 }); p.sy *= 0.97; break;
      case 'grave': Object.assign(p, { olhos: 'doente', boca: 'triste', orelhas: 0.85, doente: 2, cauda: 0 }); p.sy *= 0.94; p.sx *= 1.02; break;
      case 'morto': Object.assign(p, { fantasma: true, olhos: 'fechado', dy: -22 + Math.sin(t * 1.5) * 6, cauda: Math.sin(t * 1.2) * 0.6 }); break;
    }
    if (t > piscar.prox) { piscar.ate = t + 0.14; piscar.prox = t + ao(2.5, 5.5); }
    if (t < piscar.ate && (!p.olhos || p.olhos === 'aberto' || p.olhos === 'triste')) p.olhos = 'piscando';
    if (t > orelha.prox) { orelha.ate = t + 0.35; orelha.prox = t + ao(5, 11); }
    if (t < orelha.ate) p.twitch = Math.sin((orelha.ate - t) / 0.35 * TAU) * 0.18;
    if (acao) aplicarAcao(p, acao, t);
    return p;
  }

  function aplicarAcao(p, a, t) {
    const k = Math.min(1, (t - a.ini) / a.dur);
    if (p.fantasma) { if (a.tipo === 'carinho') Object.assign(p, { corado: 1 }); return; }
    p.livro = false;                                                    // larga o livro para reagir
    switch (a.tipo) {
      case 'comer': {
        const nham = Math.floor((t - a.ini) * 6) % 2;
        Object.assign(p, { olhos: nham ? 'fechado' : 'feliz', boca: nham ? 'aberta' : 'w', cabecaRot: 0.13, cabecaDy: 5, olhar: { x: 0, y: 0 } });
        break;
      }
      case 'ronronar': Object.assign(p, { olhos: 'fechado', boca: 'w', corado: 1, dx: Math.sin(t * 70) * 0.8, cabecaRot: Math.sin(t * 2.4) * 0.09, cauda: Math.sin(t * 4) }); break;
      case 'carinho': Object.assign(p, { olhos: 'fechado', boca: 'w', corado: 1, cabecaRot: -0.15 * Math.sin(k * Math.PI), orelhas: -0.08 }); break;
      case 'limpar': Object.assign(p, { olhos: 'feliz', boca: 'w', corado: 0.6 }); break;
      case 'festa': Object.assign(p, { olhos: 'feliz', boca: 'aberta', patas: 'cima', corado: 0.8, dy: -Math.abs(Math.sin(k * Math.PI * 3)) * 16 }); break;
      case 'giro': {
        Object.assign(p, { olhos: 'feliz', boca: 'aberta', corado: 0.8 });
        if (k < 0.18) { const u = k / 0.18; p.sy = 1 - 0.16 * u; p.sx = 1 + 0.1 * u; }
        else if (k < 0.78) {
          const u = (k - 0.18) / 0.6, e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          Object.assign(p, { dy: -92 * Math.sin(u * Math.PI), rot: e * TAU, sy: 1.06, sx: 0.95, patas: 'cima' });
        } else if (k < 0.9) { const u = (k - 0.78) / 0.12; p.sy = 0.84 + 0.16 * u; p.sx = 1.12 - 0.12 * u; }
        break;
      }
      case 'danca': {
        const b = Math.sin(t * 2.4 * Math.PI);
        Object.assign(p, {
          olhos: 'feliz', boca: 'aberta', corado: 0.8, rot: b * 0.16, dy: -Math.abs(b) * 12,
          patas: b > 0 ? 'esquerda' : 'direita', cabecaRot: -b * 0.1, cauda: Math.sin(t * 8),
        });
        break;
      }
    }
  }

  // ---------- balão ----------
  function balao(texto, x, y) {
    ctx.save();
    ctx.font = '600 15px Fredoka, "Segoe UI Emoji", sans-serif';
    const w = ctx.measureText(texto).width + 26, h = 32;
    const bx = Math.max(16 - ext.dx, Math.min(W + ext.dx - 16 - w, x - w / 2)), by = y - h;
    ctx.lineWidth = 2.5; ctx.strokeStyle = LINHA; ctx.fillStyle = '#fffdf8'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.roundRect(bx, by, w, h, 16); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 8, by + h - 1.5); ctx.lineTo(x - 2, by + h + 9); ctx.lineTo(x + 8, by + h - 1.5); ctx.fill(); ctx.stroke();
    ctx.fillRect(x - 6.5, by + h - 4, 13.5, 4);
    ctx.fillStyle = LINHA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(texto, bx + w / 2, by + h / 2 + 1);
    ctx.restore();
  }

  // ---------- quadro ----------
  function desenhar(vis, t) {
    const dt = tAgora ? Math.min(0.05, t - tAgora) : 0;
    tAgora = t; visAtual = vis;
    if (acao && t > acao.ini + acao.dur) { const prox = acao.depois; acao = null; if (prox) iniciar(prox); }

    const k = dpr * escala;
    ctx.setTransform(k, 0, 0, k, k * ext.dx, k * ext.dy);       // o desenho original fica no meio, em baixo
    ctx.clearRect(-ext.dx, -ext.dy, WL, HL);
    const c = ceu(vis.hora);
    desenharQuarto(ctx, vis, t, c, ext);
    desenharTigela(ctx, tigela && t < tigela.ate ? tigela.comida : null);

    const p = pose(vis, t);
    const alto = Math.min(1, -(p.dy || 0) / 120);
    ctx.fillStyle = 'rgba(90,62,54,.14)';
    ctx.beginPath(); ctx.ellipse(GX, GY + 2, 52 * (1 - alto * 0.45), 9 * (1 - alto * 0.45), 0, 0, TAU); ctx.fill();

    if (p.fantasma) {
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.clearRect(0, 0, fora.width, fora.height);
      fctx.setTransform(k * GE, 0, 0, k * GE, k * (GX + ext.dx), k * (GY + ext.dy));
      desenharGato(fctx, vis.gato, p, t);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.72; ctx.drawImage(fora, 0, 0); ctx.restore();
    } else {
      ctx.save(); ctx.translate(GX, GY); ctx.scale(GE, GE); desenharGato(ctx, vis.gato, p, t); ctx.restore();
    }

    emitir(vis, t, dt);
    desenharParticulas(t, dt);
    if (c.noite) desenharNoite(ctx, vis, c, ext);
    const texto = fala && t < fala.ate ? fala.texto : (!acao && vis.fala && (t % 10) < 4.5 ? vis.fala : null);
    if (texto) balao(texto, GX, topoCabeca() - 14 + (p.fantasma ? -26 : 0));
    desenharMoldura(ctx, ext);
  }

  function iniciar(tipo, extra = {}) {
    acao = { tipo, ini: tAgora, dur: DUR[tipo], ...extra };
    if (tipo === 'danca') confete(20);
    if (tipo === 'festa') confete(26);
  }

  return {
    redimensionar,
    desenhar,
    reagir: tipo => iniciar(tipo),
    comer(comida, reacao) { tigela = { comida, ate: tAgora + DUR.comer + 0.4 }; iniciar('comer', { depois: reacao }); },
    falar(texto, dur = 3) { fala = { texto, ate: tAgora + dur }; },
    confete, moedinha,
    brilharAreia() { const [x, y, w] = caixaNoQuarto(visAtual.usando.areia, ext); brilhos(x + w / 2, y + 10, 10, 70); },
    toque(xCss, yCss) {
      const x = xCss / escala - ext.dx, y = yCss / escala - ext.dy;
      if (x > 145 && x < 255 && y > 225 && y < 446) return 'gato';
      if (visAtual && dentro(x, y, caixaNoQuarto(visAtual.usando.areia, ext))) return 'areia';
      if (dentro(x, y, CAIXA_TIGELA)) return 'tigela';
      return null;
    },
  };
}
