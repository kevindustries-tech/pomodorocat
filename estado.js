// Estado do jogo e todas as ações que mexem nele. Nada aqui desenha nem toca em HTML:
// cada ação devolve { ok } ou { erro: código } e a interface traduz e decide o que mostrar.
import { R } from './regras.js';
import { INICIAIS, OPCIONAIS, porId, liberadosNoNivel } from './catalogo.js';

const CHAVE = 'pomodorocat.v1';
const DIA = 86400000;

// ---------- relógio (o modo teste consegue pular dias) ----------
let desloc = 0, teste = false;
try { desloc = +sessionStorage.getItem('pc.desloc') || 0; } catch { }
export const agora = () => Date.now() + desloc;
export function ligarTeste() { teste = true; }
export const emTeste = () => teste;
export function pularDias(n) { desloc += n * DIA; try { sessionStorage.setItem('pc.desloc', desloc); } catch { } }

const pad = n => String(n).padStart(2, '0');
export const diaDe = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const hoje = () => diaDe(agora());
function diasEntre(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DIA);
}
const lim = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- salvar e carregar ----------
function novo() {
  return {
    v: 1,
    gato: null,                // { nome, genero: 'm'|'f', cor, pelo: 'curto'|'medio'|'longo' }
    criadoEm: 0,
    moedas: 0, gemas: 0, xp: 0, vip: false,
    ganhoHoje: { dia: '', n: 0 },
    saciedade: 70, saciedadeEm: 0,
    felicidade: 80, felicidadeEm: 0,
    areia: 0,                  // refeições desde a última limpeza
    ultimoCuidado: '',         // dia do último pomodoro (ou remédio/médico/elixir)
    saude: 'ok',               // ok | doente | grave | morto — só sai daqui com tratamento
    tem: {},
    usando: { parede: 'parede-creme', janela: 'janela-simples', prateleira: 'prateleira-simples', areia: 'areia-basica' },
    tarefas: [], tarefaAtual: null,
    timer: { fase: 'parado', rodando: false, fimEm: 0, restante: 0, duracao: 0, seguidos: 0 },
    dias: {},                  // 'AAAA-MM-DD' -> pomodoros (sequência e gráficos do VIP)
    total: 0,
    ajustes: { idioma: null, musica: true, sons: true, pausar: true, telaAcesa: true, focoMin: 25, pausaMin: 5 },
    salvoEm: 0,                // quando foi salvo por último (a nuvem usa para desempatar)
  };
}

// Completa um save (do aparelho ou da nuvem) com os campos que versões novas acrescentaram.
export function normalizar(j) {
  if (!j || j.v !== 1) return null;
  const n = novo();
  return { ...n, ...j, ajustes: { ...n.ajustes, ...j.ajustes }, timer: { ...n.timer, ...j.timer }, usando: { ...n.usando, ...j.usando } };
}
export const estadoNovo = novo;
export function carregar() {
  try { const j = normalizar(JSON.parse(localStorage.getItem(CHAVE))); if (j) return j; } catch { }
  return novo();
}
export function salvar(s) { s.salvoEm = Date.now(); try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch { } }

// Qual save tem mais jogo dentro: quando aparelho e nuvem discordam, ninguém quer perder o mais completo.
export function maisCompleto(a, b) {
  const chave = x => [x?.gato ? 1 : 0, x?.total || 0, x?.xp || 0, x?.salvoEm || 0];
  const ka = chave(a), kb = chave(b);
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] > kb[i] ? a : b;
  return a;
}
export function apagarTudo() { try { localStorage.removeItem(CHAVE); sessionStorage.removeItem('pc.desloc'); } catch { } }

export function adotar(s, gato) {
  const t = agora();
  s.gato = gato; s.criadoEm = t; s.ultimoCuidado = diaDe(t);
  s.saciedade = 70; s.saciedadeEm = t; s.felicidade = 80; s.felicidadeEm = t;
  for (const it of INICIAIS) s.tem[it.id] = true;
}

// ---------- o que se lê do estado ----------
export const saciedade = s => lim(s.saciedade - (agora() - s.saciedadeEm) / 36e5 * 100 / R.horasFome, 0, 100);
export const felicidade = s => lim(s.felicidade - (agora() - s.felicidadeEm) / 36e5 * 100 / R.horasAlegria, 0, 100);
function mexer(s, campo, delta) {
  const atual = campo === 'saciedade' ? saciedade(s) : felicidade(s);
  s[campo] = lim(atual + delta, 0, 100); s[campo + 'Em'] = agora();
}
export const diasSem = s => s.ultimoCuidado ? Math.max(0, diasEntre(s.ultimoCuidado, hoje()) - 1) : 0;
export const nivel = s => 1 + Math.floor(s.xp / R.xpPorNivel);
export const xpNoNivel = s => s.xp % R.xpPorNivel;
export const areiaSuja = s => s.areia >= R.refeicoesSujamAreia;
export const ganhoRestanteHoje = s => s.ganhoHoje.dia === hoje() ? R.tetoMoedasDia - s.ganhoHoje.n : R.tetoMoedasDia;

// Doença não passa sozinha: uma vez doente, só sai com remédio/médico/elixir.
export function atualizarSaude(s) {
  if (!s.gato || s.saude === 'morto') return;
  const d = diasSem(s), S = R.saude;
  if (d >= S.morre) s.saude = 'morto';
  else if (d >= S.grave) s.saude = 'grave';
  else if (d >= S.doente && s.saude === 'ok') s.saude = 'doente';
}

// Um nome só para o "jeito" do gato agora, em ordem de prioridade.
export function humor(s) {
  if (s.saude !== 'ok') return s.saude;
  const d = diasSem(s);
  if (d >= R.saude.choraMuito) return 'choraMuito';
  if (d >= R.saude.chora) return 'chora';
  if (saciedade(s) < R.fome) return 'fome';
  const f = felicidade(s);
  if (f < 30) return 'triste';
  if (f > 70) return 'feliz';
  return 'normal';
}

export function ganharXp(s, n) {
  const antes = nivel(s);
  s.xp += n;
  const depois = nivel(s);
  if (depois === antes) return null;
  const novos = [];
  for (let k = antes + 1; k <= depois; k++) novos.push(...liberadosNoNivel(k));
  return { nivel: depois, novos };
}

// ---------- ações ----------
export function alimentar(s, id) {
  const c = porId(id);
  if (s.saude === 'morto') return { erro: 'morto' };
  if (!c || c.nivel > nivel(s)) return { erro: 'bloqueado' };
  if (saciedade(s) >= R.cheio) return { erro: 'cheio' };
  if (s.moedas < c.preco) return { erro: 'faltam', n: c.preco - s.moedas };
  s.moedas -= c.preco;
  mexer(s, 'saciedade', R.enche[c.preco]);
  mexer(s, 'felicidade', R.alegra[c.preco]);
  s.areia++;
  return { ok: true, comida: c, subiu: ganharXp(s, R.xp.comer) };
}

export function limparAreia(s) {
  if (!areiaSuja(s)) return { erro: 'limpa' };
  s.areia = 0;
  mexer(s, 'felicidade', R.alegraAreia);
  return { ok: true, subiu: ganharXp(s, R.xp.areia) };
}

export function comprar(s, id) {
  const it = porId(id);
  if (!it || !it.slot || s.tem[id]) return { erro: 'naoCompra' };
  if (it.nivel > nivel(s)) return { erro: 'nivel', n: it.nivel };
  if (s.moedas < it.preco) return { erro: 'faltam', n: it.preco - s.moedas };
  s.moedas -= it.preco;
  s.tem[id] = true;
  s.usando[it.slot] = id;
  return { ok: true, item: it };
}

export function usar(s, id) {
  const it = porId(id);
  if (!it || !s.tem[id]) return;
  if (s.usando[it.slot] === id) { if (OPCIONAIS.has(it.slot)) delete s.usando[it.slot]; }
  else s.usando[it.slot] = id;
}

const TRATA = { remedio: ['doente'], medico: ['doente', 'grave'], elixir: ['morto'] };
export function tratar(s, tipo) {
  if (!TRATA[tipo].includes(s.saude)) return { erro: 'naoPrecisa' };
  const p = R.precos[tipo];
  if (s.moedas < p) return { erro: 'faltam', n: p - s.moedas };
  s.moedas -= p;
  s.saude = 'ok';
  s.ultimoCuidado = hoje();
  if (tipo === 'elixir') {
    const t = agora();
    s.saciedade = 60; s.saciedadeEm = t; s.felicidade = 60; s.felicidadeEm = t; s.areia = 0;
  }
  return { ok: true };
}

// ---------- pomodoro ----------
// O timer guarda o horário de término, não conta tique-taque: com a tela apagada o
// celular congela a página, e quando ela volta a conta continua certa.
export const segFoco = s => teste ? 20 : (s.vip ? s.ajustes.focoMin : R.focoMin) * 60;
export function segPausa(s) {
  const longa = s.vip && s.timer.seguidos > 0 && s.timer.seguidos % R.pausaLongaCada === 0;
  if (teste) return longa ? 12 : 8;
  return (longa ? R.pausaLongaMin : (s.vip ? s.ajustes.pausaMin : R.pausaMin)) * 60;
}
export function iniciar(s, fase) {
  const ms = (fase === 'foco' ? segFoco(s) : segPausa(s)) * 1000;
  Object.assign(s.timer, { fase, rodando: true, duracao: ms, restante: ms, fimEm: agora() + ms });
}
export function pausar(s) {
  const t = s.timer;
  if (!t.rodando) return;
  t.restante = Math.max(0, t.fimEm - agora());
  t.rodando = false;
}
export function retomar(s) {
  const t = s.timer;
  if (t.rodando || (t.fase !== 'foco' && t.fase !== 'pausa')) return;
  t.fimEm = agora() + t.restante;
  t.rodando = true;
}
export function desistir(s) { Object.assign(s.timer, { fase: 'parado', rodando: false, seguidos: 0 }); }
export function pularPausa(s) { Object.assign(s.timer, { fase: 'parado', rodando: false }); }
export const restante = s => s.timer.rodando ? Math.max(0, s.timer.fimEm - agora()) : s.timer.restante;

// Chamado sempre: devolve um evento quando a fase acaba (inclusive se acabou com o app fechado).
export function tique(s) {
  const t = s.timer;
  if (!t.rodando || agora() < t.fimEm) return null;
  t.rodando = false;
  if (t.fase === 'foco') {
    t.fase = 'fimFoco'; t.seguidos++;
    return { evento: 'foco', ...concluirFoco(s, t.fimEm) };
  }
  t.fase = 'parado';
  return { evento: 'pausa' };
}

function concluirFoco(s, quando) {
  const d = diaDe(quando);
  if (s.ganhoHoje.dia !== d) s.ganhoHoje = { dia: d, n: 0 };
  const ganhou = s.ganhoHoje.n < R.tetoMoedasDia ? R.moedasPorPomodoro : 0;
  s.moedas += ganhou;
  s.ganhoHoje.n += ganhou;
  if (!s.ultimoCuidado || d > s.ultimoCuidado) s.ultimoCuidado = d;   // vale mesmo sem moeda (teto)
  s.total++;
  s.dias[d] = (s.dias[d] || 0) + 1;
  const tarefa = s.tarefas.find(x => x.id === s.tarefaAtual);
  if (tarefa) tarefa.pomos++;
  mexer(s, 'felicidade', 5);
  return { ganhou, tarefa };
}

// ---------- tarefas ----------
export function novaTarefa(s, texto) {
  texto = texto.trim().slice(0, 80);
  if (!texto) return;
  s.tarefas.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), texto, feita: false, pomos: 0 });
}
export function marcarTarefa(s, id) {
  const t = s.tarefas.find(x => x.id === id);
  if (!t) return;
  t.feita = !t.feita;
  if (t.feita && s.tarefaAtual === id) s.tarefaAtual = null;
}
export function removerTarefa(s, id) {
  s.tarefas = s.tarefas.filter(x => x.id !== id);
  if (s.tarefaAtual === id) s.tarefaAtual = null;
}
