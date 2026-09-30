// Cola de tudo: adoção, cartão do timer, folhas (comida, loja, gato, tarefas, ajustes) e o laço de desenho.
import { R } from './regras.js';
import { COMIDAS, PAREDES, MOVEIS, ROUPAS, INICIAIS, porId } from './catalogo.js';
import * as E from './estado.js';
import { criarCena } from './cena.js';
import { desenharGato, PELAGENS, PELOS } from './gato.js';
import { miniatura } from './quarto.js';
import * as Som from './som.js';

const VERSAO = '0.1';
const $ = sel => document.querySelector(sel);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const moeda = n => `<span class="m"><svg class="ic"><use href="#i-moeda"/></svg>${n}</span>`;
const barra = v => `<span class="barra"><i style="width:${Math.round(v)}%"></i></span>`;
const btn = (acao, rotulo, cor = '', off = false) => `<button class="bt ${cor}" data-acao="${acao}" ${off ? 'disabled' : ''}>${rotulo}</button>`;

if (new URLSearchParams(location.search).has('teste')) E.ligarTeste();
let s = E.carregar();
let cena = null;
// Depois de "apagar tudo" nada mais salva: senão o save velho volta quando a página sai de cena.
let apagando = false;
const salvar = () => { if (!apagando) E.salvar(s); };

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
  b.textContent = 'Toque de novo'; b.classList.add('certeza');
  setTimeout(() => { if (b.isConnected) { b.textContent = b.dataset.antes; b.classList.remove('certeza'); delete b.dataset.certeza; } }, 3000);
  return false;
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

// ---------- adoção ----------
function mostrarAdocao() {
  $('#app').hidden = true; $('#adocao').hidden = false;
  const esc2 = { nome: '', genero: null, cor: 'laranja', pelo: 'curto' };
  const prev = $('#previa'), dpr = Math.min(2, devicePixelRatio || 1);
  prev.width = 200 * dpr; prev.height = 210 * dpr; prev.style.width = '200px'; prev.style.height = '210px';
  const pctx = prev.getContext('2d');

  $('#aCores').innerHTML = Object.entries(PELAGENS).map(([k, p]) =>
    `<button class="cor ${k === esc2.cor ? 'on' : ''}" data-v="${k}"><canvas data-cor="${k}"></canvas>${p.nome}</button>`).join('');
  for (const c of document.querySelectorAll('canvas[data-cor]')) {
    c.width = c.height = 52 * dpr; c.style.width = c.style.height = '52px';
    const x = c.getContext('2d'); x.scale(dpr, dpr); x.translate(26, 26); x.scale(0.42, 0.42); x.translate(0, 92);
    desenharGato(x, { cor: c.dataset.cor, pelo: 'curto' }, {}, 0);
  }
  $('#aPelo').innerHTML = Object.entries(PELOS).map(([k, n]) => `<button class="bt ${k === esc2.pelo ? 'on' : ''}" data-v="${k}">${n}</button>`).join('');

  const pronto = () => { $('#adotar').disabled = !(esc2.nome && esc2.genero); };
  $('#aNome').addEventListener('input', e => { esc2.nome = e.target.value.trim(); pronto(); });
  const escolha = (sel, campo) => $(sel).addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    esc2[campo] = b.dataset.v;
    for (const o of $(sel).children) o.classList.toggle('on', o === b);
    pronto();
  });
  escolha('#aGenero', 'genero'); escolha('#aCores', 'cor'); escolha('#aPelo', 'pelo');

  let vivo = true, piscaAte = 0, proxPisca = 1.5;
  const anima = ms => {
    if (!vivo) return;
    const t = ms / 1000;
    if (t > proxPisca) { piscaAte = t + 0.14; proxPisca = t + 2 + Math.random() * 3; }
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0); pctx.clearRect(0, 0, 200, 210);
    pctx.fillStyle = 'rgba(90,62,54,.12)'; pctx.beginPath(); pctx.ellipse(100, 196, 56, 9, 0, 0, Math.PI * 2); pctx.fill();
    pctx.translate(100, 194); pctx.scale(1.05, 1.05);
    desenharGato(pctx, { cor: esc2.cor, pelo: esc2.pelo }, { olhos: t < piscaAte ? 'piscando' : 'aberto', cauda: Math.sin(t * 1.7) * 0.8, sy: 1 + Math.sin(t * 2.2) * 0.012, corado: 0.3 }, t);
    requestAnimationFrame(anima);
  };
  requestAnimationFrame(anima);

  $('#adotar').addEventListener('click', () => {
    if (!esc2.nome || !esc2.genero) return;
    Som.iniciar();
    E.adotar(s, { nome: esc2.nome.slice(0, 14), genero: esc2.genero, cor: esc2.cor, pelo: esc2.pelo });
    salvar(); vivo = false;
    iniciarJogo();
    cena.reagir('festa');
    cena.falar(`Oi! Eu sou ${s.gato.nome} 💛`, 4);
  });
}

// ---------- jogo ----------
function encaixar() {
  const r = $('#palco').getBoundingClientRect();
  const larg = Math.floor(Math.min(r.width, r.height * 400 / 460));
  if (larg > 0) cena.redimensionar(larg, Math.floor(larg * 460 / 400));
}

function iniciarJogo() {
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
  switch (h) {
    case 'grave': return 'Me leva no médico? 🏥';
    case 'doente': return 'Tô dodói… preciso de remédio 💊';
    case 'choraMuito': return 'Buáá… cadê você?';
    case 'chora': return 'Senti sua falta ontem…';
    case 'fome': return 'Tô com fominha…';
    case 'morto': return null;
  }
  return E.areiaSuja(s) ? 'Troca minha areia? 🧹' : null;
}

let ultimaSaude = 0, ultimoRelogio = '', ultimoProg = -1;
function quadro(ms) {
  const t = ms / 1000;
  const ev = E.tique(s);
  if (ev) aoTerminar(ev);
  if (t - ultimaSaude > 5) {
    ultimaSaude = t;
    const antes = s.saude; E.atualizarSaude(s);
    if (antes !== s.saude) { salvar(); render(); }
  }
  cena.desenhar(visao(), t);
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
    document.title = tm.rodando ? `${txt} · PomodoroCat` : 'PomodoroCat';
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
    if (ev.ganhou) { cena.moedinha(ev.ganhou); setTimeout(() => Som.efeito('moeda'), 500); cena.falar(`Oba! +${ev.ganhou} moeda 🪙`, 3.5); }
    else cena.falar('Foco feito! (moedas de hoje acabaram)', 4);
    if (ev.tarefa) aviso(`🍅 +1 em “${ev.tarefa.texto}”`);
  } else {
    Som.efeito('fimPausa'); vibrar(150);
    cena.falar('Bora mais um? 💪', 3);
  }
  salvar(); render();
}

// ---------- desenho da interface ----------
function render() {
  renderTopo(); renderCartao(); renderAlerta();
}
function renderTopo() {
  $('#nMoedas').textContent = s.moedas;
  $('#nNivel').textContent = 'Nv ' + E.nivel(s);
  $('#xpBarra').style.width = (E.xpNoNivel(s) / R.xpPorNivel * 100) + '%';
  $('#navNome').textContent = s.gato.nome;
}
function renderCartao() {
  const tm = s.timer, n = esc(s.gato.nome);
  $('#cartao').dataset.fase = tm.fase;
  let rotulo, html;
  if (tm.fase === 'parado') {
    rotulo = 'Hora de focar?';
    html = btn('comecar', '▶ Começar foco', 'rosa');
  } else if (tm.fase === 'foco') {
    rotulo = tm.rodando ? `Focando… ${n} está lendo com você` : 'Foco pausado';
    html = (tm.rodando ? (s.ajustes.pausar ? btn('pausar', '⏸ Pausar') : '') : btn('retomar', '▶ Continuar', 'rosa')) + btn('desistir', 'Desistir');
  } else if (tm.fase === 'fimFoco') {
    rotulo = 'Foco concluído! Hora da pausa ☕';
    html = btn('pausa', '☕ Pausa', 'verde') + btn('pular', 'Pular');
  } else {
    rotulo = tm.rodando ? 'Pausa — estica as pernas!' : 'Pausa parada';
    html = (tm.rodando ? '' : btn('retomar', '▶ Continuar', 'verde')) + btn('pular', 'Encerrar');
  }
  $('#fase').textContent = rotulo;
  $('#botoes').innerHTML = html;
  const tarefa = s.tarefas.find(x => x.id === s.tarefaAtual);
  $('#tarefaAtual').textContent = tarefa ? `📌 ${tarefa.texto}` : '＋ escolher tarefa';
}
function renderAlerta() {
  const n = esc(s.gato.nome), P = R.precos;
  let html = '';
  if (s.saude === 'doente') html = `<span>${n} está dodói.</span><div class="grupo">${btn('remedio', `💊 Remédio ${moeda(P.remedio)}`, 'rosa')}</div>`;
  else if (s.saude === 'grave') html = `<span>${n} precisa ir ao médico.</span><div class="grupo">${btn('medico', `🏥 Médico ${moeda(P.medico)}`, 'rosa')}</div>`;
  else if (s.saude === 'morto') html = `<span>${n} virou estrelinha ⭐</span><div class="grupo">${btn('elixir', `✨ Elixir ${moeda(P.elixir)}`, 'rosa')}${btn('gema', '💎 Gema', '', true)}</div>`;
  else if (E.areiaSuja(s)) html = `<span>A caixa de areia está suja.</span><div class="grupo">${btn('areia', '🧹 Limpar', 'verde')}</div>`;
  $('#alerta').innerHTML = html; $('#alerta').hidden = !html;
}

// ---------- ações do jogo ----------
function subiuDeNivel(r) {
  if (!r) return;
  setTimeout(() => { nivelNovo = r; Som.efeito('festa'); cena.reagir('festa'); abrir('nivel'); }, 3600);
}
function comer(id) {
  const r = E.alimentar(s, id);
  if (r.erro) { aviso(r.erro); Som.efeito('nao'); return; }
  fechar();
  const reacao = s.saude === 'ok' ? ['ronronar', 'giro', 'danca'][r.comida.preco - 1] : 'ronronar';
  cena.comer(r.comida, reacao);
  setTimeout(() => Som.efeito({ ronronar: 'ronrom', giro: 'giro', danca: 'festa' }[reacao]), 1500);
  subiuDeNivel(r.subiu);
  salvar(); render();
}
function limparAreia() {
  const r = E.limparAreia(s);
  if (r.erro) { aviso(r.erro); return; }
  Som.efeito('pop'); cena.reagir('limpar'); cena.brilharAreia();
  cena.falar('Cheirosinho! ✨', 2.5);
  aviso(`+${R.xp.areia} XP`);
  subiuDeNivel(r.subiu);
  salvar(); render();
}
function tratar(tipo) {
  const r = E.tratar(s, tipo);
  if (r.erro) { aviso(r.erro); Som.efeito('nao'); return; }
  const o = E.txt(s).o;
  Som.efeito(tipo === 'elixir' ? 'festa' : 'pop');
  cena.reagir(tipo === 'elixir' ? 'festa' : 'carinho');
  cena.falar(tipo === 'elixir' ? 'Voltei! 💛' : `Obrigad${o}! Já tô melhor 💛`, 3.5);
  if (aba) renderFolha();
  salvar(); render();
}

const ACOES = {
  comecar() { E.iniciar(s, 'foco'); telaAcesa(true); cena.falar('Vamos focar! 📖', 2.5); Som.efeito('pop'); },
  pausar() { E.pausar(s); telaAcesa(false); },
  retomar() { E.retomar(s); if (s.timer.fase === 'foco') telaAcesa(true); },
  desistir(b) {
    if (!confirmou(b)) return false;
    E.desistir(s); telaAcesa(false); cena.falar('Tudo bem, a gente tenta de novo 💛', 3);
  },
  pausa() { E.iniciar(s, 'pausa'); },
  pular() { E.pularPausa(s); },
  remedio() { tratar('remedio'); return false; },
  medico() { tratar('medico'); return false; },
  elixir() { tratar('elixir'); return false; },
  areia() { limparAreia(); return false; },
  fechar() { fechar(); return false; },
  apagar(b) { if (!confirmou(b)) return false; apagando = true; E.apagarTudo(); location.replace(location.pathname + location.search); return false; },
};

// ---------- folhas ----------
let aba = null, abaLoja = 'moveis', nivelNovo = null;
function abrir(qual) { aba = qual; renderFolha(); $('#folha').classList.add('aberta'); $('#folhaConteudo').scrollTop = 0; }
function fechar() { $('#folha').classList.remove('aberta'); aba = null; }
const cabecalho = titulo => `<header><h2>${titulo}</h2><button class="x" data-acao="fechar" aria-label="Fechar">✕</button></header>`;

function renderFolha() {
  const f = { comida: folhaComida, loja: folhaLoja, gato: folhaGato, tarefas: folhaTarefas, ajustes: folhaAjustes, nivel: folhaNivel }[aba];
  if (!f) return;
  $('#folhaConteudo').innerHTML = f();
  desenharMiniaturas();
}

const REACAO = { 1: 'ronrona', 2: 'gira no ar', 3: 'dancinha' };
function folhaComida() {
  const n = E.nivel(s);
  const lista = COMIDAS.filter(c => c.nivel <= n + 1);
  return `${cabecalho('Comidinhas')}
    <div class="saldo">${moeda(s.moedas)}<span class="suave">barriguinha</span>${barra(E.saciedade(s))}</div>
    <div class="grade">${lista.map(c => {
      const tranc = c.nivel > n;
      return `<button class="item ${tranc ? 'trancado' : ''}" data-comer="${c.id}">
        <span class="emoji">${c.icone}</span><b>${c.nome}</b>
        <small>${tranc ? `🔒 nível ${c.nivel}` : REACAO[c.preco]}</small>${moeda(c.preco)}</button>`;
    }).join('')}</div>`;
}

function folhaLoja() {
  const n = E.nivel(s);
  const base = { moveis: INICIAIS.filter(i => i.slot !== 'parede'), paredes: INICIAIS.filter(i => i.slot === 'parede'), roupas: [] }[abaLoja];
  const lista = { moveis: MOVEIS, paredes: PAREDES, roupas: ROUPAS }[abaLoja];
  const itens = [...base, ...lista.filter(i => i.nivel <= n + 1)];
  const card = it => {
    const tem = s.tem[it.id], usando = s.usando[it.slot] === it.id, tranc = !tem && it.nivel > n;
    const botao = tem ? `<button class="bt acao ${usando ? 'verde' : ''}" data-usar="${it.id}">${usando ? 'Usando ✓' : 'Usar'}</button>`
      : tranc ? `<small>🔒 nível ${it.nivel}</small>`
        : `<button class="bt acao amarelo" data-comprar="${it.id}" ${s.moedas < it.preco ? 'disabled' : ''}>${moeda(it.preco)}</button>`;
    return `<div class="item ${tranc ? 'trancado' : ''} ${usando ? 'usando' : ''}"><canvas data-mini="${it.id}"></canvas><b>${it.nome}</b>${botao}</div>`;
  };
  const tab = (k, nome) => `<button class="${abaLoja === k ? 'on' : ''}" data-aba="${k}">${nome}</button>`;
  return `${cabecalho('Loja')}
    <div class="saldo">${moeda(s.moedas)}<span class="suave">cada nível novo libera mais 1 de cada</span></div>
    <div class="abas">${tab('moveis', 'Móveis')}${tab('paredes', 'Paredes')}${tab('roupas', 'Roupinhas')}</div>
    <div class="grade">${itens.map(card).join('')}</div>`;
}

function folhaGato() {
  const n = esc(s.gato.nome), T = E.txt(s), P = R.precos, S = R.saude;
  const saude = { ok: 'Saudável 💚', doente: 'Dodói 🤒', grave: 'Precisa de médico 🏥', morto: 'Virou estrelinha ⭐' }[s.saude];
  return `${cabecalho(n)}
    <p class="suave">${T.gatinho[0].toUpperCase() + T.gatinho.slice(1)} ${PELAGENS[s.gato.cor].nome.toLowerCase()} · nível ${E.nivel(s)} · ${E.xpNoNivel(s)}/${R.xpPorNivel} XP</p>
    <div class="medidor"><span>Barriguinha</span>${barra(E.saciedade(s))}</div>
    <div class="medidor"><span>Alegria</span>${barra(E.felicidade(s))}</div>
    <div class="linha"><span>Saúde</span><b>${saude}</b></div>
    <div class="linha"><span>Dias sem pomodoro</span><b>${E.diasSem(s)}</b></div>
    <div class="linha"><span>Moedas que ainda dá pra ganhar hoje</span><b>${E.ganhoRestanteHoje(s)}</b></div>
    <div class="linha"><span>Pomodoros no total</span><b>${s.total}</b></div>
    <h3>Cuidados</h3>
    <div class="cuidados">
      ${btn('remedio', `💊 Remédio ${moeda(P.remedio)}`, 'rosa', s.saude !== 'doente')}
      ${btn('medico', `🏥 Médico ${moeda(P.medico)}`, 'rosa', !['doente', 'grave'].includes(s.saude))}
      ${btn('elixir', `✨ Elixir ${moeda(P.elixir)}`, 'rosa', s.saude !== 'morto')}
      ${btn('areia', '🧹 Limpar areia', 'verde', !E.areiaSuja(s))}
    </div>
    <h3>Como cuidar</h3>
    <p class="suave">Cada pomodoro de ${R.focoMin} min vale 1 moeda (até ${R.tetoMoedasDia} por dia). Comida de 1 moeda: ${T.ele} ronrona; de 2: gira no ar; de 3: dancinha. Alimentar e limpar a areia dão ${R.xp.comer} XP; a cada ${R.xpPorNivel} XP sobe de nível.</p>
    <p class="suave">Sem pomodoro: ${S.chora} dia, ${T.ele} chora; ${S.choraMuito} dias, chora mais; ${S.doente} dias, fica dodói (remédio); ${S.grave} dias, precisa de médico; ${S.morre} dias, vira estrelinha (elixir).</p>
    <h3>Em breve</h3>
    <p class="suave">Passeios a partir do nível ${R.nivelPasseio} e um cômodo novo a cada ${R.comodoCadaNiveis} níveis.</p>`;
}

function folhaTarefas() {
  const li = t => `<li class="${s.tarefaAtual === t.id ? 'atual' : ''}">
      <button class="check ${t.feita ? 'on' : ''}" data-marcar="${t.id}" aria-label="Marcar como feita"></button>
      <span class="txt">${esc(t.texto)}</span>${t.pomos ? `<span class="pomos">🍅 ${t.pomos}</span>` : ''}
      ${t.feita ? '' : `<button class="mini" data-focar="${t.id}" aria-label="Focar nesta">${s.tarefaAtual === t.id ? '📌' : '📍'}</button>`}
      <button class="mini" data-apagar="${t.id}" aria-label="Apagar">✕</button></li>`;
  const pend = s.tarefas.filter(t => !t.feita), feitas = s.tarefas.filter(t => t.feita);
  return `${cabecalho('Tarefas')}
    <form class="nova" id="formTarefa"><input type="text" id="novaTarefa" maxlength="80" placeholder="O que você vai fazer?" autocomplete="off"><button class="bt rosa">＋</button></form>
    ${pend.length ? `<ul class="tarefas">${pend.map(li).join('')}</ul>` : ''}
    ${feitas.length ? `<h3>Feitas</h3><ul class="tarefas feitas">${feitas.map(li).join('')}</ul>` : ''}
    ${s.tarefas.length ? '<p class="suave">📌 = a tarefa do próximo pomodoro. Cada foco concluído soma um 🍅 nela.</p>' : '<p class="vazio">Nenhuma tarefa ainda.</p>'}`;
}

function folhaAjustes() {
  const a = s.ajustes;
  const chave = (k, rotulo, dica = '') => `<label class="chave"><span>${rotulo}${dica ? `<small>${dica}</small>` : ''}</span><input type="checkbox" data-ajuste="${k}" ${a[k] ? 'checked' : ''}><i></i></label>`;
  return `${cabecalho('Ajustes')}
    ${chave('musica', 'Musiquinha')}
    ${chave('sons', 'Sons')}
    ${chave('pausar', 'Deixar pausar o pomodoro')}
    ${chave('telaAcesa', 'Manter a tela acesa no foco', 'Com a tela apagada o celular não deixa o alarme tocar.')}
    <h3>VIP 👑</h3>
    <div class="linha trancada"><span>Escolher o tempo do pomodoro</span><b>🔒</b></div>
    <div class="linha trancada"><span>Pausa longa a cada ${R.pausaLongaCada}</span><b>🔒</b></div>
    <div class="linha trancada"><span>Dias seguidos e gráficos</span><b>🔒</b></div>
    <p class="suave">Em breve.</p>
    <h3>Sobre</h3>
    <p class="suave">PomodoroCat ${VERSAO} · versão de teste. Os dados ficam só neste aparelho.</p>
    ${btn('apagar', 'Apagar tudo e recomeçar', 'perigo')}`;
}

function folhaNivel() {
  const r = nivelNovo;
  if (!r) return '';
  const card = it => it.icone
    ? `<div class="item"><span class="emoji">${it.icone}</span><b>${it.nome}</b></div>`
    : `<div class="item"><canvas data-mini="${it.id}"></canvas><b>${it.nome}</b></div>`;
  const extra = [];
  if (r.nivel === R.nivelPasseio) extra.push('Passeios liberados (em breve!)');
  if (r.nivel % R.comodoCadaNiveis === 0) extra.push('Você poderá escolher um cômodo novo (em breve!)');
  return `<div class="festa">${cabecalho('')}
    <div class="grande">Nível ${r.nivel}! 🎉</div>
    <p>Chegou coisa nova na loja:</p>
    <div class="novidades">${r.novos.map(card).join('')}</div>
    ${extra.map(t => `<p class="suave">${t}</p>`).join('')}
    ${btn('fechar', 'Oba!', 'rosa')}</div>`;
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
document.addEventListener('click', e => {
  const alvo = e.target.closest('[data-acao],[data-abre],[data-comer],[data-comprar],[data-usar],[data-aba],[data-marcar],[data-focar],[data-apagar]');
  if (!alvo || !s.gato) return;
  const d = alvo.dataset;
  Som.iniciar();
  if (d.abre) { Som.efeito('pop'); abrir(d.abre); return; }
  if (d.acao) {
    const f = ACOES[d.acao];
    if (f && f(alvo) !== false) { salvar(); render(); }
    return;
  }
  if (d.comer) { comer(d.comer); return; }
  if (d.comprar) {
    const r = E.comprar(s, d.comprar);
    if (r.erro) { aviso(r.erro); Som.efeito('nao'); return; }
    Som.efeito('moeda'); aviso(`${r.item.nome} ✓`);
    if (r.item.slot === 'cabeca' || r.item.slot === 'rosto' || r.item.slot === 'pescoco' || r.item.slot === 'corpo') cena.reagir('giro');
    else cena.reagir('carinho');
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
  else if (alvo === 'areia') { if (E.areiaSuja(s)) limparAreia(); else cena.falar('A areia tá limpinha!', 2); }
  else if (alvo === 'tigela') abrir('comida');
});

document.addEventListener('pointerdown', () => Som.iniciar());
document.addEventListener('visibilitychange', () => {
  if (!s.gato) return;
  if (document.visibilityState === 'visible') {
    E.atualizarSaude(s); render();
    if (s.timer.rodando && s.timer.fase === 'foco') telaAcesa(true);
    Som.suspender(false);
  } else { salvar(); Som.suspender(true); }
});

// ---------- modo teste (?teste=1): foco de 20 s e botões para pular o tempo ----------
function painelTeste() {
  const p = document.createElement('div');
  p.id = 'teste';
  p.innerHTML = '<b>teste</b><button data-t="dia">+1 dia</button><button data-t="moeda">+5 🪙</button><button data-t="xp">+50 XP</button><button data-t="fome">fome</button><button data-t="suja">sujar</button>';
  p.addEventListener('click', e => {
    const t = e.target.dataset.t; if (!t) return;
    if (t === 'dia') { E.pularDias(1); E.atualizarSaude(s); aviso(`Dias sem pomodoro: ${E.diasSem(s)}`); }
    if (t === 'moeda') s.moedas += 5;
    if (t === 'xp') subiuDeNivel(E.ganharXp(s, 50));
    if (t === 'fome') { s.saciedade = 10; s.saciedadeEm = E.agora(); }
    if (t === 'suja') s.areia = R.refeicoesSujamAreia;
    salvar(); render();
  });
  document.body.appendChild(p);
}

// ---------- partida ----------
Som.configurar(s.ajustes);
if (s.gato) iniciarJogo(); else mostrarAdocao();
