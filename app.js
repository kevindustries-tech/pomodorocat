// Cola de tudo: idioma, conta, adoção, cartão do timer, folhas (comida, loja, gato, tarefas, ajustes) e o laço de desenho.
import { R } from './regras.js';
import { COMIDAS, PAREDES, MOVEIS, ROUPAS, INICIAIS, porId } from './catalogo.js';
import * as E from './estado.js';
import * as N from './nuvem.js';
import { criarCena } from './cena.js';
import { desenharGato, PELAGENS, PELOS } from './gato.js';
import { miniatura } from './quarto.js';
import * as Som from './som.js';
import { t, IDIOMAS, definirIdioma, detectarIdioma, nomeItem, nomePelagem, traduzirPagina } from './i18n.js';

const VERSAO = '0.3';
const $ = sel => document.querySelector(sel);
const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const moeda = n => `<span class="m"><svg class="ic"><use href="#i-moeda"/></svg>${n}</span>`;
const barra = v => `<span class="barra"><i style="width:${Math.round(v)}%"></i></span>`;
const btn = (acao, rotulo, cor = '', off = false) => `<button class="bt ${cor}" data-acao="${acao}" ${off ? 'disabled' : ''}>${rotulo}</button>`;

if (new URLSearchParams(location.search).has('teste')) E.ligarTeste();
let s = E.carregar();
let cena = null, jogoIniciado = false;
const vg = (extra = {}) => ({ nome: s.gato?.nome || '', g: s.gato?.genero, ...extra });   // variáveis de texto do gato
const msgErro = r => t('erro.' + r.erro, vg({ n: r.n }));

// Depois de "apagar tudo" nada mais salva: senão o save velho volta quando a página sai de cena.
let apagando = false;
function salvar() {
  if (apagando) return;
  E.salvar(s);
  if (s.gato) N.agendarSubida(s);
}

// ---------- avisos ----------
let tAviso;
function aviso(txt) {
  if (!txt) return;
  const a = $('#aviso'); a.textContent = txt; a.classList.add('on');
  clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('on'), 2800);
}
function vibrar(p) { try { navigator.vibrate?.(p); } catch { } }

// Botões que apagam algo pedem um segundo toque em até 3 s.
function confirmou(b) {
  if (b.dataset.certeza && Date.now() - b.dataset.certeza < 3000) return true;
  b.dataset.certeza = Date.now(); b.dataset.antes ??= b.textContent;
  b.textContent = t('bt.certeza'); b.classList.add('certeza');
  setTimeout(() => { if (b.isConnected) { b.textContent = b.dataset.antes; b.classList.remove('certeza'); delete b.dataset.certeza; } }, 3000);
  return false;
}

// ---------- idioma ----------
function montarIdiomas() {
  const atual = s.ajustes.idioma;
  for (const el of document.querySelectorAll('.idiomas'))
    el.innerHTML = Object.keys(IDIOMAS).map(l => `<button class="${l === atual ? 'on' : ''}" data-idioma="${l}">${l.toUpperCase()}</button>`).join('');
}
function trocarIdioma(l) {
  s.ajustes.idioma = l;
  definirIdioma(l); traduzirPagina(); montarIdiomas();
  if (!$('#adocao').hidden) textosAdocao();
  if (!$('#conta').hidden) renderConta();
  if (jogoIniciado) { render(); if (aba) renderFolha(); }
  salvar();
}

// ---------- tela acesa durante o foco ----------
// Nenhum celular garante alarme de PWA com a tela apagada; então, no foco, a tela fica acesa.
let trava = null;
async function telaAcesa(sim) {
  try {
    if (sim && s.ajustes.telaAcesa && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      if (!trava) { trava = await navigator.wakeLock.request('screen'); trava.addEventListener('release', () => { trava = null; }); }
    } else if (!sim && trava) { await trava.release(); trava = null; }
  } catch { trava = null; }
}

// ---------- conta (obrigatória quando há servidor e internet; sem rede, joga e pede depois) ----------
let modoConta = 'criar';
async function precisaConta() {
  if (!N.configurada() || navigator.onLine === false) return false;
  if (!(await N.disponivel())) return false;
  return !(await N.sessao());
}
function mostrarConta() {
  $('#conta').hidden = false;
  $('#cErro').hidden = true;
  renderConta();
}
function renderConta() {
  for (const b of $('#cAbas').children) b.classList.toggle('on', b.dataset.modo === modoConta);
  $('#cRepete').hidden = modoConta !== 'criar';
  $('#cSenha').autocomplete = modoConta === 'criar' ? 'new-password' : 'current-password';
  $('#cEnviar').textContent = t(modoConta === 'criar' ? 'login.criar' : 'login.entrar');
}
function erroConta(txt) { const e = $('#cErro'); e.textContent = txt; e.hidden = !txt; }

$('#cAbas').addEventListener('click', e => {
  const b = e.target.closest('[data-modo]'); if (!b) return;
  modoConta = b.dataset.modo; erroConta(''); renderConta();
});
$('#cForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#cEmail').value.trim(), senha = $('#cSenha').value, senha2 = $('#cSenha2').value;
  if (!N.emailValido(email)) return erroConta(t('login.e.email'));
  if (N.emailExemplo(email)) return erroConta(t('login.e.exemplo'));
  if (senha.length < 6) return erroConta(t('login.e.curta'));
  if (modoConta === 'criar' && senha !== senha2) return erroConta(t('login.e.diferentes'));
  erroConta('');
  const b = $('#cEnviar');
  b.disabled = true; b.textContent = t(modoConta === 'criar' ? 'login.criando' : 'login.entrando');
  const r = await (modoConta === 'criar' ? N.criarConta(email, senha) : N.entrar(email, senha));
  b.disabled = false; renderConta();
  if (r.erro) return erroConta(t('login.e.' + r.erro));
  $('#cSenha').value = $('#cSenha2').value = '';
  await sincronizar();
  $('#conta').hidden = true;
  seguir();
});

// Junta aparelho e nuvem: fica o save mais completo (mais pomodoros; depois XP; depois o mais recente).
async function sincronizar() {
  const r = await N.baixar();
  if (!r.ok) return;
  const nuvem = E.normalizar(r.dados);
  if (nuvem && E.maisCompleto(s, nuvem) === nuvem) {
    s = nuvem;
    E.salvar(s);
    definirIdioma(s.ajustes.idioma || detectarIdioma()); traduzirPagina(); montarIdiomas();
    if (s.gato) aviso(t('aviso.nuvemVeio', vg()));
    if (jogoIniciado) { if (!s.gato) location.reload(); else { render(); if (aba) renderFolha(); } }
  } else if (s.gato) await N.subir(s);
}

// Depois de idioma e conta resolvidos: jogo, ou adoção se ainda não tem gato.
function seguir() {
  if (s.gato) { if (!jogoIniciado) iniciarJogo(); }
  else mostrarAdocao();
}

// ---------- adoção ----------
let adocaoMontada = false;
function textosAdocao() {
  for (const b of document.querySelectorAll('#aCores .cor')) b.querySelector('span').textContent = nomePelagem(b.dataset.v, PELAGENS[b.dataset.v].nome);
  for (const b of document.querySelectorAll('#aPelo .bt')) b.textContent = t('pelo.' + b.dataset.v);
}
function mostrarAdocao() {
  $('#app').hidden = true; $('#adocao').hidden = false;
  if (adocaoMontada) return;
  adocaoMontada = true;
  const esc2 = { nome: '', genero: null, cor: 'laranja', pelo: 'curto' };
  const prev = $('#previa'), dpr = Math.min(2, devicePixelRatio || 1);
  prev.width = 200 * dpr; prev.height = 210 * dpr; prev.style.width = '200px'; prev.style.height = '210px';
  const pctx = prev.getContext('2d');

  $('#aCores').innerHTML = Object.keys(PELAGENS).map(k =>
    `<button class="cor ${k === esc2.cor ? 'on' : ''}" data-v="${k}"><canvas data-cor="${k}"></canvas><span></span></button>`).join('');
  for (const c of document.querySelectorAll('canvas[data-cor]')) {
    c.width = c.height = 52 * dpr; c.style.width = c.style.height = '52px';
    const x = c.getContext('2d'); x.scale(dpr, dpr); x.translate(26, 26); x.scale(0.42, 0.42); x.translate(0, 92);
    desenharGato(x, { cor: c.dataset.cor, pelo: 'curto' }, {}, 0);
  }
  $('#aPelo').innerHTML = Object.keys(PELOS).map(k => `<button class="bt ${k === esc2.pelo ? 'on' : ''}" data-v="${k}"></button>`).join('');
  textosAdocao();

  const pronto = () => { $('#adotar').disabled = !(esc2.nome && esc2.genero); };
  $('#aNome').addEventListener('input', e => { esc2.nome = e.target.value.trim(); pronto(); });
  const escolha = (sel, campo) => $(sel).addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    esc2[campo] = b.dataset.v;
    for (const o of $(sel).children) o.classList.toggle('on', o === b);
    pronto();
  });
  escolha('#aGenero', 'genero'); escolha('#aCores', 'cor'); escolha('#aPelo', 'pelo');

  let piscaAte = 0, proxPisca = 1.5;
  const anima = ms => {
    if ($('#adocao').hidden) return;
    const tt = ms / 1000;
    if (tt > proxPisca) { piscaAte = tt + 0.14; proxPisca = tt + 2 + Math.random() * 3; }
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0); pctx.clearRect(0, 0, 200, 210);
    pctx.fillStyle = 'rgba(90,62,54,.12)'; pctx.beginPath(); pctx.ellipse(100, 196, 56, 9, 0, 0, Math.PI * 2); pctx.fill();
    pctx.translate(100, 194); pctx.scale(1.05, 1.05);
    desenharGato(pctx, { cor: esc2.cor, pelo: esc2.pelo }, { olhos: tt < piscaAte ? 'piscando' : 'aberto', cauda: Math.sin(tt * 1.7) * 0.8, sy: 1 + Math.sin(tt * 2.2) * 0.012, corado: 0.3 }, tt);
    requestAnimationFrame(anima);
  };
  requestAnimationFrame(anima);

  $('#adotar').addEventListener('click', () => {
    if (!esc2.nome || !esc2.genero) return;
    Som.iniciar();
    E.adotar(s, { nome: esc2.nome.slice(0, 14), genero: esc2.genero, cor: esc2.cor, pelo: esc2.pelo });
    salvar();
    iniciarJogo();
    cena.reagir('festa');
    cena.falar(t('fala.oi', vg()), 4);
  });
}

// ---------- jogo ----------
// O quarto estica para ocupar o espaço todo (pedido da Bianca): no mínimo 400 × 460 lógicos,
// mais largo se sobrar largura, mais alto se sobrar altura.
function encaixar() {
  const r = $('#palco').getBoundingClientRect();
  if (r.width < 10 || r.height < 10) return;
  const a = r.width / r.height;
  let wl = 400, hl = 460;
  if (a >= 400 / 460) wl = Math.min(620, 460 * a); else hl = Math.min(680, 400 / a);
  const e = Math.min(r.width / wl, r.height / hl);
  cena.redimensionar(Math.floor(wl * e), Math.floor(hl * e), wl, hl);
}

function iniciarJogo() {
  jogoIniciado = true;
  $('#adocao').hidden = true; $('#app').hidden = false;
  cena = criarCena($('#tela'));
  encaixar();
  new ResizeObserver(encaixar).observe($('#palco'));
  E.atualizarSaude(s);
  render();
  requestAnimationFrame(quadro);
  if (s.timer.rodando && s.timer.fase === 'foco') telaAcesa(true);
  if (E.emTeste()) painelTeste();
}

function visao() {
  const u = s.usando, h = E.humor(s);
  return {
    gato: { cor: s.gato.cor, pelo: s.gato.pelo, roupas: { cabeca: u.cabeca, rosto: u.rosto, pescoco: u.pescoco, corpo: u.corpo } },
    humor: h,
    fase: s.timer.fase === 'foco' && s.timer.rodando ? 'foco' : s.timer.fase,
    hora: new Date(E.agora()).getHours(),
    suja: E.areiaSuja(s), usando: u,
    fala: falaDoEstado(h),
  };
}
function falaDoEstado(h) {
  if (h === 'morto') return null;
  if (['grave', 'doente', 'choraMuito', 'chora', 'fome'].includes(h)) return t('fala.' + h, vg());
  return E.areiaSuja(s) ? t('fala.areia') : null;
}

let ultimaSaude = 0, ultimoRelogio = '', ultimoProg = -1;
function quadro(ms) {
  const tt = ms / 1000;
  const ev = E.tique(s);
  if (ev) aoTerminar(ev);
  if (tt - ultimaSaude > 5) {
    ultimaSaude = tt;
    const antes = s.saude; E.atualizarSaude(s);
    if (antes !== s.saude) { salvar(); render(); }
  }
  if (s.gato) cena.desenhar(visao(), tt);
  relogio();
  requestAnimationFrame(quadro);
}

function relogio() {
  const tm = s.timer;
  const ms = tm.fase === 'parado' ? E.segFoco(s) * 1000 : tm.fase === 'fimFoco' ? E.segPausa(s) * 1000 : E.restante(s);
  const seg = Math.ceil(ms / 1000);
  const txt = `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;
  if (txt !== ultimoRelogio) {
    ultimoRelogio = txt; $('#tempo').textContent = txt;
    document.title = tm.rodando ? `${txt} · Study Cat` : 'Study Cat';
  }
  const prog = (tm.fase === 'foco' || tm.fase === 'pausa') && tm.duracao ? 1 - ms / tm.duracao : 0;
  const pc = Math.round(prog * 1000) / 10;
  if (pc !== ultimoProg) { ultimoProg = pc; $('#progresso').style.width = pc + '%'; }
}

function aoTerminar(ev) {
  telaAcesa(false);
  if (ev.evento === 'foco') {
    Som.efeito('sino'); vibrar([200, 100, 200]);
    cena.reagir('festa');
    if (ev.ganhou) { cena.moedinha(ev.ganhou); setTimeout(() => Som.efeito('moeda'), 500); cena.falar(t('fala.moeda', { n: ev.ganhou }), 3.5); }
    else cena.falar(t('fala.teto'), 4);
    if (ev.tarefa) aviso(t('aviso.tarefa', { t: ev.tarefa.texto }));
  } else {
    Som.efeito('fimPausa'); vibrar(150);
    cena.falar(t('fala.maisUm'), 3);
  }
  salvar(); render();
}

// ---------- desenho da interface ----------
function render() { renderTopo(); renderCartao(); renderAlerta(); }
function renderTopo() {
  $('#nMoedas').textContent = s.moedas;
  $('#nNivel').textContent = t('nivelCurto', { n: E.nivel(s) });
  $('#xpBarra').style.width = (E.xpNoNivel(s) / R.xpPorNivel * 100) + '%';
  $('#navNome').textContent = s.gato.nome;
}
function renderCartao() {
  const tm = s.timer;
  $('#cartao').dataset.fase = tm.fase;
  let rotulo, html;
  if (tm.fase === 'parado') {
    rotulo = t('timer.parado');
    html = btn('comecar', t('bt.comecar'), 'rosa');
  } else if (tm.fase === 'foco') {
    rotulo = tm.rodando ? t(s.saude === 'ok' ? 'timer.focando' : 'timer.focandoSo', vg()) : t('timer.focoPausado');
    html = (tm.rodando ? (s.ajustes.pausar ? btn('pausar', t('bt.pausar')) : '') : btn('retomar', t('bt.continuar'), 'rosa')) + btn('desistir', t('bt.desistir'));
  } else if (tm.fase === 'fimFoco') {
    rotulo = t('timer.fimFoco');
    html = btn('pausa', t('bt.pausa'), 'verde') + btn('pular', t('bt.pular'));
  } else {
    rotulo = tm.rodando ? t('timer.pausa') : t('timer.pausaParada');
    html = (tm.rodando ? '' : btn('retomar', t('bt.continuar'), 'verde')) + btn('pular', t('bt.encerrar'));
  }
  $('#fase').textContent = rotulo;
  $('#botoes').innerHTML = html;
  const tarefa = s.tarefas.find(x => x.id === s.tarefaAtual);
  $('#tarefaAtual').textContent = tarefa ? `📌 ${tarefa.texto}` : t('tarefa.escolher');
}
function renderAlerta() {
  const P = R.precos;
  let html = '';
  if (s.saude === 'doente') html = `<span>${esc(t('alerta.doente', vg()))}</span><div class="grupo">${btn('remedio', `${t('bt.remedio')} ${moeda(P.remedio)}`, 'rosa')}</div>`;
  else if (s.saude === 'grave') html = `<span>${esc(t('alerta.grave', vg()))}</span><div class="grupo">${btn('medico', `${t('bt.medico')} ${moeda(P.medico)}`, 'rosa')}</div>`;
  else if (s.saude === 'morto') html = `<span>${esc(t('alerta.morto', vg()))}</span><div class="grupo">${btn('elixir', `${t('bt.elixir')} ${moeda(P.elixir)}`, 'rosa')}${btn('gema', t('bt.gema'), '', true)}</div>`;
  else if (E.areiaSuja(s)) html = `<span>${t('alerta.areia')}</span><div class="grupo">${btn('areia', t('bt.limpar'), 'verde')}</div>`;
  $('#alerta').innerHTML = html; $('#alerta').hidden = !html;
}

// ---------- ações do jogo ----------
function subiuDeNivel(r) {
  if (!r) return;
  setTimeout(() => { nivelNovo = r; Som.efeito('festa'); cena.reagir('festa'); abrir('nivel'); }, 3600);
}
function comer(id) {
  const r = E.alimentar(s, id);
  if (r.erro) { aviso(msgErro(r)); Som.efeito('nao'); return; }
  fechar();
  const reacao = s.saude === 'ok' ? ['ronronar', 'giro', 'danca'][r.comida.preco - 1] : 'ronronar';
  cena.comer(r.comida, reacao);
  setTimeout(() => Som.efeito({ ronronar: 'ronrom', giro: 'giro', danca: 'festa' }[reacao]), 1500);
  subiuDeNivel(r.subiu);
  salvar(); render();
}
function limparAreia() {
  const r = E.limparAreia(s);
  if (r.erro) { aviso(msgErro(r)); return; }
  Som.efeito('pop'); cena.reagir('limpar'); cena.brilharAreia();
  cena.falar(t('fala.cheiroso'), 2.5);
  aviso(t('aviso.xp', { n: R.xp.areia }));
  subiuDeNivel(r.subiu);
  salvar(); render();
}
function tratar(tipo) {
  const r = E.tratar(s, tipo);
  if (r.erro) { aviso(msgErro(r)); Som.efeito('nao'); return; }
  Som.efeito(tipo === 'elixir' ? 'festa' : 'pop');
  cena.reagir(tipo === 'elixir' ? 'festa' : 'carinho');
  cena.falar(t(tipo === 'elixir' ? 'fala.voltei' : 'fala.melhor', vg()), 3.5);
  if (aba) renderFolha();
  salvar(); render();
}

const ACOES = {
  comecar() { E.iniciar(s, 'foco'); telaAcesa(true); cena.falar(t('fala.focar'), 2.5); Som.efeito('pop'); },
  pausar() { E.pausar(s); telaAcesa(false); },
  retomar() { E.retomar(s); if (s.timer.fase === 'foco') telaAcesa(true); },
  desistir(b) {
    if (!confirmou(b)) return false;
    E.desistir(s); telaAcesa(false); cena.falar(t('fala.desistiu'), 3);
  },
  pausa() { E.iniciar(s, 'pausa'); },
  pular() { E.pularPausa(s); },
  remedio() { tratar('remedio'); return false; },
  medico() { tratar('medico'); return false; },
  elixir() { tratar('elixir'); return false; },
  areia() { limparAreia(); return false; },
  fechar() { fechar(); return false; },
  async sair() { fechar(); await N.sair(); mostrarConta(); return false; },
  // Com conta, a nuvem também é zerada — senão o save completo voltaria da nuvem no próximo login.
  async apagar(b) {
    if (!confirmou(b)) return false;
    apagando = true;
    if (await N.sessao()) await N.subir(E.estadoNovo());
    E.apagarTudo();
    location.replace(location.pathname + location.search);
    return false;
  },
};

// ---------- folhas ----------
let aba = null, abaLoja = 'moveis', nivelNovo = null;
function abrir(qual) { aba = qual; renderFolha(); $('#folha').classList.add('aberta'); $('#folhaConteudo').scrollTop = 0; }
function fechar() { $('#folha').classList.remove('aberta'); aba = null; }
const cabecalho = titulo => `<header><h2>${titulo}</h2><button class="x" data-acao="fechar" aria-label="${t('fechar')}">✕</button></header>`;

function renderFolha() {
  const f = { comida: folhaComida, loja: folhaLoja, gato: folhaGato, tarefas: folhaTarefas, ajustes: folhaAjustes, nivel: folhaNivel }[aba];
  if (!f) return;
  $('#folhaConteudo').innerHTML = f();
  desenharMiniaturas();
  if (aba === 'ajustes') N.quemSou().then(email => { const el = $('#contaEstado'); if (el && email) el.textContent = t('conta.como', { email }); });
}

function folhaComida() {
  const n = E.nivel(s);
  const lista = COMIDAS.filter(c => c.nivel <= n + 1);
  return `${cabecalho(t('comida.titulo'))}
    <div class="saldo">${moeda(s.moedas)}<span class="suave">${t('comida.barriga')}</span>${barra(E.saciedade(s))}</div>
    <div class="grade">${lista.map(c => {
      const tranc = c.nivel > n;
      return `<button class="item ${tranc ? 'trancado' : ''}" data-comer="${c.id}">
        <span class="emoji">${c.icone}</span><b>${esc(nomeItem(c))}</b>
        <small>${tranc ? t('trancado', { n: c.nivel }) : t('reacao.' + c.preco)}</small>${moeda(c.preco)}</button>`;
    }).join('')}</div>`;
}

function folhaLoja() {
  const n = E.nivel(s);
  const base = { moveis: INICIAIS.filter(i => i.slot !== 'parede'), paredes: INICIAIS.filter(i => i.slot === 'parede'), roupas: [] }[abaLoja];
  const lista = { moveis: MOVEIS, paredes: PAREDES, roupas: ROUPAS }[abaLoja];
  const itens = [...base, ...lista.filter(i => i.nivel <= n + 1)];
  const card = it => {
    const tem = s.tem[it.id], usando = s.usando[it.slot] === it.id, tranc = !tem && it.nivel > n;
    const botao = tem ? `<button class="bt acao ${usando ? 'verde' : ''}" data-usar="${it.id}">${t(usando ? 'loja.usando' : 'loja.usar')}</button>`
      : tranc ? `<small>${t('trancado', { n: it.nivel })}</small>`
        : `<button class="bt acao amarelo" data-comprar="${it.id}" ${s.moedas < it.preco ? 'disabled' : ''}>${moeda(it.preco)}</button>`;
    return `<div class="item ${tranc ? 'trancado' : ''} ${usando ? 'usando' : ''}"><canvas data-mini="${it.id}"></canvas><b>${esc(nomeItem(it))}</b>${botao}</div>`;
  };
  const tab = k => `<button class="${abaLoja === k ? 'on' : ''}" data-aba="${k}">${t('loja.' + k)}</button>`;
  return `${cabecalho(t('loja.titulo'))}
    <div class="saldo">${moeda(s.moedas)}<span class="suave">${t('loja.dica')}</span></div>
    <div class="abas">${tab('moveis')}${tab('paredes')}${tab('roupas')}</div>
    <div class="grade">${itens.map(card).join('')}</div>`;
}

function folhaGato() {
  const P = R.precos, S = R.saude, g = s.gato.genero;
  const cor = nomePelagem(s.gato.cor, PELAGENS[s.gato.cor].nome);
  return `${cabecalho(esc(s.gato.nome))}
    <p class="suave">${t('gato.resumo', { g, cor, nivel: E.nivel(s), xp: E.xpNoNivel(s), max: R.xpPorNivel })}</p>
    <div class="medidor"><span>${t('gato.barriga')}</span>${barra(E.saciedade(s))}</div>
    <div class="medidor"><span>${t('gato.alegria')}</span>${barra(E.felicidade(s))}</div>
    <div class="linha"><span>${t('gato.saude')}</span><b>${t('saude.' + s.saude, vg())}</b></div>
    <div class="linha"><span>${t('gato.diasSem')}</span><b>${E.diasSem(s)}</b></div>
    <div class="linha"><span>${t('gato.restante')}</span><b>${E.ganhoRestanteHoje(s)}</b></div>
    <div class="linha"><span>${t('gato.total')}</span><b>${s.total}</b></div>
    <h3>${t('gato.cuidados')}</h3>
    <div class="cuidados">
      ${btn('remedio', `${t('bt.remedio')} ${moeda(P.remedio)}`, 'rosa', s.saude !== 'doente')}
      ${btn('medico', `${t('bt.medico')} ${moeda(P.medico)}`, 'rosa', !['doente', 'grave'].includes(s.saude))}
      ${btn('elixir', `${t('bt.elixir')} ${moeda(P.elixir)}`, 'rosa', s.saude !== 'morto')}
      ${btn('areia', t('gato.limparAreia'), 'verde', !E.areiaSuja(s))}
    </div>
    <h3>${t('gato.comoCuidar')}</h3>
    <p class="suave">${t('gato.regra1', { g, foco: R.focoMin, teto: R.tetoMoedasDia, xp: R.xp.comer, max: R.xpPorNivel })}</p>
    <p class="suave">${t('gato.regra2', { g, ...S })}</p>
    <h3>${t('emBreve')}</h3>
    <p class="suave">${t('gato.breve', { passeio: R.nivelPasseio, comodo: R.comodoCadaNiveis })}</p>`;
}

function folhaTarefas() {
  const li = x => `<li class="${s.tarefaAtual === x.id ? 'atual' : ''}">
      <button class="check ${x.feita ? 'on' : ''}" data-marcar="${x.id}" aria-label="${t('tarefas.marcar')}"></button>
      <span class="txt">${esc(x.texto)}</span>${x.pomos ? `<span class="pomos">🍅 ${x.pomos}</span>` : ''}
      ${x.feita ? '' : `<button class="mini" data-focar="${x.id}" aria-label="${t('tarefas.focar')}">${s.tarefaAtual === x.id ? '📌' : '📍'}</button>`}
      <button class="mini" data-apagar="${x.id}" aria-label="${t('tarefas.apagar')}">✕</button></li>`;
  const pend = s.tarefas.filter(x => !x.feita), feitas = s.tarefas.filter(x => x.feita);
  return `${cabecalho(t('tarefas.titulo'))}
    <form class="nova" id="formTarefa"><input type="text" id="novaTarefa" maxlength="80" placeholder="${t('tarefas.placeholder')}" autocomplete="off"><button class="bt rosa">＋</button></form>
    ${pend.length ? `<ul class="tarefas">${pend.map(li).join('')}</ul>` : ''}
    ${feitas.length ? `<h3>${t('tarefas.feitas')}</h3><ul class="tarefas feitas">${feitas.map(li).join('')}</ul>` : ''}
    ${s.tarefas.length ? `<p class="suave">${t('tarefas.dica')}</p>` : `<p class="vazio">${t('tarefas.vazio')}</p>`}`;
}

function folhaAjustes() {
  const a = s.ajustes;
  const chave = (k, rotulo, dica = '') => `<label class="chave"><span>${rotulo}${dica ? `<small>${dica}</small>` : ''}</span><input type="checkbox" data-ajuste="${k}" ${a[k] ? 'checked' : ''}><i></i></label>`;
  const idiomas = Object.entries(IDIOMAS).map(([l, nome]) => `<button class="${l === a.idioma ? 'on' : ''}" data-idioma="${l}">${nome}</button>`).join('');
  const conta = N.configurada()
    ? `<div class="linha"><span id="contaEstado">…</span>${btn('sair', t('conta.sair'))}</div><p class="suave">${t('conta.sincronizado')}</p>`
    : `<p class="suave">${t('conta.semNuvem')}</p>`;
  return `${cabecalho(t('ajustes.titulo'))}
    <h3>${t('ajustes.idioma')}</h3>
    <div class="abas">${idiomas}</div>
    ${chave('musica', t('ajustes.musica'))}
    ${chave('sons', t('ajustes.sons'))}
    ${chave('pausar', t('ajustes.pausar'))}
    ${chave('telaAcesa', t('ajustes.tela'), t('ajustes.telaDica'))}
    <h3>${t('conta.titulo')}</h3>
    ${conta}
    <h3>VIP 👑</h3>
    <div class="linha trancada"><span>${t('vip.tempo')}</span><b>🔒</b></div>
    <div class="linha trancada"><span>${t('vip.pausaLonga', { n: R.pausaLongaCada })}</span><b>🔒</b></div>
    <div class="linha trancada"><span>${t('vip.graficos')}</span><b>🔒</b></div>
    <p class="suave">${t('vip.breve')}</p>
    <h3>${t('ajustes.sobre')}</h3>
    <p class="suave">${t('ajustes.versao', { v: VERSAO })}</p>
    ${btn('apagar', t('ajustes.apagar'), 'perigo')}`;
}

function folhaNivel() {
  const r = nivelNovo;
  if (!r) return '';
  const card = it => it.icone
    ? `<div class="item"><span class="emoji">${it.icone}</span><b>${esc(nomeItem(it))}</b></div>`
    : `<div class="item"><canvas data-mini="${it.id}"></canvas><b>${esc(nomeItem(it))}</b></div>`;
  const extra = [];
  if (r.nivel === R.nivelPasseio) extra.push(t('nivel.passeio'));
  if (r.nivel % R.comodoCadaNiveis === 0) extra.push(t('nivel.comodo'));
  return `<div class="festa">${cabecalho('')}
    <div class="grande">${t('nivel.titulo', { n: r.nivel })}</div>
    <p>${t('nivel.novidades')}</p>
    <div class="novidades">${r.novos.map(card).join('')}</div>
    ${extra.map(x => `<p class="suave">${x}</p>`).join('')}
    ${btn('fechar', t('nivel.oba'), 'rosa')}</div>`;
}

function desenharMiniaturas() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  for (const c of document.querySelectorAll('#folhaConteudo canvas[data-mini]')) {
    const it = porId(c.dataset.mini), lado = c.closest('.novidades') ? 56 : 74;
    c.width = c.height = lado * dpr; c.style.width = c.style.height = lado + 'px';
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    if (['cabeca', 'rosto', 'pescoco', 'corpo'].includes(it.slot)) {
      const busto = it.slot === 'cabeca' || it.slot === 'rosto';
      x.translate(lado / 2, busto ? lado / 2 : lado * 0.96);
      const e = busto ? lado / 125 : lado / 175;
      x.scale(e, e); if (busto) x.translate(0, 100);
      desenharGato(x, { cor: s.gato.cor, pelo: s.gato.pelo, roupas: { [it.slot]: it.id } }, { olhos: 'feliz' }, 0);
    } else miniatura(x, it, lado);
  }
}

// ---------- cliques ----------
document.addEventListener('click', async e => {
  const idi = e.target.closest('[data-idioma]');
  if (idi) { trocarIdioma(idi.dataset.idioma); return; }
  const alvo = e.target.closest('[data-acao],[data-abre],[data-comer],[data-comprar],[data-usar],[data-aba],[data-marcar],[data-focar],[data-apagar]');
  if (!alvo || !s.gato || !jogoIniciado) return;
  const d = alvo.dataset;
  Som.iniciar();
  if (d.abre) { Som.efeito('pop'); abrir(d.abre); return; }
  if (d.acao) {
    const f = ACOES[d.acao];
    if (f && (await f(alvo)) !== false) { salvar(); render(); }
    return;
  }
  if (d.comer) { comer(d.comer); return; }
  if (d.comprar) {
    const r = E.comprar(s, d.comprar);
    if (r.erro) { aviso(msgErro(r)); Som.efeito('nao'); return; }
    Som.efeito('moeda'); aviso(t('aviso.comprou', { item: nomeItem(r.item) }));
    cena.reagir(['cabeca', 'rosto', 'pescoco', 'corpo'].includes(r.item.slot) ? 'giro' : 'carinho');
  }
  else if (d.usar) { E.usar(s, d.usar); Som.efeito('pop'); }
  else if (d.aba) abaLoja = d.aba;
  else if (d.marcar) { E.marcarTarefa(s, d.marcar); Som.efeito('pop'); }
  else if (d.focar) { s.tarefaAtual = s.tarefaAtual === d.focar ? null : d.focar; }
  else if (d.apagar) E.removerTarefa(s, d.apagar);
  salvar(); render(); renderFolha();
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'formTarefa') return;
  e.preventDefault();
  const inp = $('#novaTarefa'), antes = s.tarefas.length;
  E.novaTarefa(s, inp.value);
  if (s.tarefas.length === antes) return;
  if (!s.tarefaAtual) s.tarefaAtual = s.tarefas[s.tarefas.length - 1].id;
  salvar(); render(); renderFolha();
  $('#novaTarefa').focus();
});

document.addEventListener('change', e => {
  const k = e.target.dataset?.ajuste;
  if (!k) return;
  s.ajustes[k] = e.target.checked;
  Som.configurar(s.ajustes);
  if (k === 'telaAcesa') telaAcesa(e.target.checked && s.timer.rodando && s.timer.fase === 'foco');
  salvar(); render();
});

$('#folha').addEventListener('click', e => { if (e.target.id === 'folha') fechar(); });

$('#tela').addEventListener('pointerdown', e => {
  Som.iniciar();
  const r = e.currentTarget.getBoundingClientRect();
  const alvo = cena.toque(e.clientX - r.left, e.clientY - r.top);
  if (alvo === 'gato') { cena.reagir('carinho'); Som.efeito('ronromCurto'); }
  else if (alvo === 'areia') { if (E.areiaSuja(s)) limparAreia(); else cena.falar(t('fala.areiaLimpa'), 2); }
  else if (alvo === 'tigela') abrir('comida');
});

document.addEventListener('pointerdown', () => Som.iniciar());
document.addEventListener('visibilitychange', () => {
  if (!jogoIniciado) return;
  if (document.visibilityState === 'visible') {
    E.atualizarSaude(s); render();
    if (s.timer.rodando && s.timer.fase === 'foco') telaAcesa(true);
    Som.suspender(false);
  } else { salvar(); Som.suspender(true); }
});
// Voltou a internet: quem ainda não tem conta recebe a tela agora.
addEventListener('online', async () => { if (jogoIniciado && $('#conta').hidden && (await precisaConta())) mostrarConta(); });

// ---------- modo teste (?teste=1): foco de 20 s e botões para pular o tempo ----------
function painelTeste() {
  const p = document.createElement('div');
  p.id = 'teste';
  p.innerHTML = '<b>teste</b><button data-teste="dia">+1 dia</button><button data-teste="moeda">+5 🪙</button><button data-teste="xp">+50 XP</button><button data-teste="fome">fome</button><button data-teste="suja">sujar</button>';
  p.addEventListener('click', e => {
    const k = e.target.dataset.teste; if (!k) return;
    if (k === 'dia') { E.pularDias(1); E.atualizarSaude(s); aviso(t('aviso.dias', { n: E.diasSem(s) })); }
    if (k === 'moeda') s.moedas += 5;
    if (k === 'xp') subiuDeNivel(E.ganharXp(s, 50));
    if (k === 'fome') { s.saciedade = 10; s.saciedadeEm = E.agora(); }
    if (k === 'suja') s.areia = R.refeicoesSujamAreia;
    salvar(); render();
  });
  document.body.appendChild(p);
}

// ---------- partida ----------
if (!s.ajustes.idioma) s.ajustes.idioma = detectarIdioma();
definirIdioma(s.ajustes.idioma);
traduzirPagina();
montarIdiomas();
Som.configurar(s.ajustes);
(async () => {
  if (await precisaConta()) {
    if (s.gato) iniciarJogo();          // o quarto aparece atrás; a tela da conta fica por cima até entrar
    mostrarConta();
    return;
  }
  seguir();
  if (N.configurada() && (await N.sessao())) sincronizar();
})();
