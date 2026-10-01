// Conta (e-mail + senha) e cópia do save no Supabase — mesmo esquema do Ilha.
//
// - O localStorage continua sendo a fonte durante o jogo. A nuvem é cópia de segurança: o app
//   funciona offline igual, só não sincroniza.
// - O supabase-js vem do CDN por import dinâmico. Se o CDN cair ou estiver sem rede, nada quebra.
// - A chave abaixo é a PUBLISHABLE: feita para ficar no cliente; quem protege os dados é o RLS
//   (supabase/saves.sql). A secret / service_role NUNCA entra neste repositório.
// - "Confirm email" precisa estar DESLIGADO no projeto: o servidor de e-mail grátis do Supabase
//   só entrega para membros do projeto. Por isso ainda não existe "esqueci a senha" (precisa de SMTP).
// - ?nuvem=falsa na URL troca o servidor por um de mentira no próprio navegador, para testar as telas.

const URL_SB = '';     // Project URL do projeto pomodorocat
const CHAVE = '';      // sb_publishable_...
const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const falsa = new URLSearchParams(location.search).get('nuvem') === 'falsa';
export const configurada = () => falsa || !!(URL_SB && CHAVE);

const limpaEmail = e => String(e || '').trim().toLowerCase();
export const emailValido = e => /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(limpaEmail(e));
export const emailExemplo = e => /@(exemplo|example)\.(com|com\.br|org)$/i.test(limpaEmail(e));

// ---------- cliente ----------
let _sb = null, _erroCdn = false;
async function cliente() {
  if (falsa) return FALSA;
  if (_sb) return _sb;
  if (_erroCdn || !configurada()) return null;
  try {
    const { createClient } = await import(CDN);
    _sb = createClient(URL_SB, CHAVE, { auth: { persistSession: true, autoRefreshToken: true } });
    return _sb;
  } catch (e) { _erroCdn = true; console.warn('Supabase indisponível:', e); return null; }
}
export async function disponivel() { return navigator.onLine !== false && !!(await cliente()); }

export async function sessao() {
  const sb = await cliente(); if (!sb) return null;
  try { const { data } = await sb.auth.getSession(); return data.session || null; } catch { return null; }
}
export async function quemSou() { const s = await sessao(); return s ? (s.user.email || '') : null; }

// Erros devolvidos como código; a tela traduz (login.e.*).
function codigo(m) {
  const s = String(m).toLowerCase();
  if (s.includes('invalid login') || s.includes('invalid credentials')) return 'errada';
  if (s.includes('already registered') || s.includes('already been registered') || s.includes('already exists')) return 'existe';
  if (s.includes('confirm')) return 'confirmar';
  if (s.includes('rate') || s.includes('many')) return 'muitas';
  if (s.includes('password') && (s.includes('6') || s.includes('short') || s.includes('weak'))) return 'curta';
  if (s.includes('email') && s.includes('valid')) return 'email';
  if (s.includes('fetch') || s.includes('network')) return 'rede';
  return 'rede';
}

export async function criarConta(email, senha) {
  const sb = await cliente(); if (!sb) return { erro: 'rede' };
  const { error } = await sb.auth.signUp({ email: limpaEmail(email), password: senha });
  if (error) return { erro: codigo(error.message) };
  if (!(await sessao())) return entrar(email, senha);   // com "Confirm email" desligado a sessão já vem aberta
  return { ok: true };
}
export async function entrar(email, senha) {
  const sb = await cliente(); if (!sb) return { erro: 'rede' };
  const { error } = await sb.auth.signInWithPassword({ email: limpaEmail(email), password: senha });
  if (error) return { erro: codigo(error.message) };
  return { ok: true };
}
export async function sair() {
  clearTimeout(timer); timer = null; pendente = null;
  const sb = await cliente(); if (sb) await sb.auth.signOut();
}

// ---------- save ----------
export async function baixar() {
  const sb = await cliente(); if (!sb) return { erro: 'rede' };
  const s = await sessao(); if (!s) return { erro: 'sessao' };
  const { data, error } = await sb.from('saves').select('dados, atualizado_em').eq('user_id', s.user.id).maybeSingle();
  if (error) { console.warn('baixar:', error.message); return { erro: 'rede' }; }
  return { ok: true, dados: data ? data.dados : null };
}
export async function subir(estado) {
  const sb = await cliente(); if (!sb) return { erro: 'rede' };
  const s = await sessao(); if (!s) return { erro: 'sessao' };
  const { error } = await sb.from('saves')
    .upsert({ user_id: s.user.id, dados: estado, atualizado_em: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) { console.warn('subir:', error.message); return { erro: 'rede' }; }
  return { ok: true };
}

// Sobe no máximo uma vez a cada 4 s; sempre o estado mais novo.
let timer = null, pendente = null;
export function agendarSubida(estado) {
  if (!configurada()) return;
  pendente = estado;
  if (timer) return;
  timer = setTimeout(async () => {
    timer = null;
    const est = pendente; pendente = null;
    if (est && (await sessao())) await subir(est);
  }, 4000);
}

// ---------- servidor de mentira (?nuvem=falsa) ----------
// Imita só o pedaço do supabase-js que este arquivo usa. Guarda contas no localStorage do navegador.
const FALSA = (() => {
  const ler = () => { try { return JSON.parse(localStorage.getItem('pc.nuvemFalsa')) || { contas: {}, saves: {} }; } catch { return { contas: {}, saves: {} }; } };
  const gravar = b => localStorage.setItem('pc.nuvemFalsa', JSON.stringify(b));
  const sess = () => { const e = sessionStorage.getItem('pc.nuvemFalsa.sessao'); return e ? { user: { id: e, email: e } } : null; };
  const espera = () => new Promise(r => setTimeout(r, 400));
  return {
    auth: {
      getSession: async () => ({ data: { session: sess() } }),
      signUp: async ({ email, password }) => {
        await espera(); const b = ler();
        if (b.contas[email]) return { error: { message: 'User already registered' } };
        if (password.length < 6) return { error: { message: 'Password should be at least 6 characters' } };
        b.contas[email] = password; gravar(b); sessionStorage.setItem('pc.nuvemFalsa.sessao', email); return { error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        await espera(); const b = ler();
        if (b.contas[email] !== password) return { error: { message: 'Invalid login credentials' } };
        sessionStorage.setItem('pc.nuvemFalsa.sessao', email); return { error: null };
      },
      signOut: async () => sessionStorage.removeItem('pc.nuvemFalsa.sessao'),
    },
    from: () => ({
      select: () => ({ eq: (_, id) => ({ maybeSingle: async () => { const d = ler().saves[id]; return { data: d ? { dados: d } : null, error: null }; } }) }),
      upsert: async ({ user_id, dados }) => { const b = ler(); b.saves[user_id] = dados; gravar(b); return { error: null }; },
    }),
  };
})();
