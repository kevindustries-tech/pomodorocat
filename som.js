// Música e sons gerados na hora com Web Audio — nenhum arquivo de áudio para baixar.
// O navegador só libera som depois de um toque, então iniciar() é chamado no primeiro toque.

let ac = null, mestre, canalMusica, canalEfeitos;
let querMusica = true, querSons = true, relogio = null;
let tMel = 0, iMel = 0, tBaixo = 0, iBaixo = 0;

// Caixinha de música em Fá, 76 bpm, 8 compassos que se repetem. [nota MIDI, tempos]; 0 = pausa.
const BPM = 76, TEMPO = 60 / BPM;
const MELODIA = [
  [69, 1], [72, 1], [74, 1], [72, 1], [69, 1], [67, 1], [65, 2],
  [67, 1], [69, 1], [72, 1], [69, 1], [67, 3], [0, 1],
  [69, 1], [72, 1], [74, 1], [77, 1], [74, 1], [72, 1], [69, 2],
  [67, 1], [69, 1], [67, 1], [65, 1], [65, 3], [0, 1],
];
const BAIXO = [53, 50, 48, 48, 53, 50, 48, 53];   // um por compasso

const hz = m => 440 * Math.pow(2, (m - 69) / 12);

function nota(midi, quando, dur, ganho, tipo, saida) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = tipo; o.frequency.value = hz(midi);
  g.gain.setValueAtTime(0.0001, quando);
  g.gain.exponentialRampToValueAtTime(ganho, quando + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
  o.connect(g); g.connect(saida);
  o.start(quando); o.stop(quando + dur + 0.05);
}

function agendar() {
  const ate = ac.currentTime + 0.5;
  while (tMel < ate) {
    const [m, b] = MELODIA[iMel];
    if (m) { nota(m, tMel, 1.3, 0.13, 'triangle', canalMusica); nota(m + 12, tMel, 0.9, 0.035, 'sine', canalMusica); }
    tMel += b * TEMPO; iMel = (iMel + 1) % MELODIA.length;
  }
  while (tBaixo < ate) {
    nota(BAIXO[iBaixo], tBaixo, 4 * TEMPO, 0.07, 'sine', canalMusica);
    tBaixo += 4 * TEMPO; iBaixo = (iBaixo + 1) % BAIXO.length;
  }
}

function ligarMusica() {
  if (!ac || relogio) return;
  tMel = tBaixo = ac.currentTime + 0.1; iMel = iBaixo = 0;
  canalMusica.gain.cancelScheduledValues(ac.currentTime);
  canalMusica.gain.setValueAtTime(0.0001, ac.currentTime);
  canalMusica.gain.exponentialRampToValueAtTime(0.6, ac.currentTime + 2);
  agendar();
  relogio = setInterval(agendar, 150);
}
function desligarMusica() {
  if (!relogio) return;
  clearInterval(relogio); relogio = null;
  canalMusica.gain.cancelScheduledValues(ac.currentTime);
  canalMusica.gain.setTargetAtTime(0.0001, ac.currentTime, 0.2);
}

export function iniciar() {
  if (ac) { if (ac.state === 'suspended' && document.visibilityState === 'visible') ac.resume(); return; }
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  mestre = ac.createGain(); mestre.gain.value = 0.9; mestre.connect(ac.destination);
  canalMusica = ac.createGain(); canalMusica.gain.value = 0.0001; canalMusica.connect(mestre);
  canalEfeitos = ac.createGain(); canalEfeitos.gain.value = 0.6; canalEfeitos.connect(mestre);
  if (querMusica) ligarMusica();
}

export function configurar({ musica, sons }) {
  querMusica = musica; querSons = sons;
  if (!ac) return;
  if (musica) ligarMusica(); else desligarMusica();
}

// App em segundo plano: silêncio. Ao voltar, continua de onde estava.
export function suspender(sim) {
  if (!ac) return;
  if (sim) { desligarMusica(); ac.suspend(); }
  else { ac.resume().then(() => { if (querMusica) ligarMusica(); }); }
}

function ronrom(dur) {
  const t0 = ac.currentTime, n = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
  let ult = 0;
  for (let i = 0; i < n; i++) { ult = (ult + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = ult * 3.5; }   // ruído marrom
  const src = ac.createBufferSource(); src.buffer = buf;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
  const am = ac.createGain(); am.gain.value = 0.5;
  const lfo = ac.createOscillator(); lfo.frequency.value = 23;
  const lfoG = ac.createGain(); lfoG.gain.value = 0.5;
  lfo.connect(lfoG); lfoG.connect(am.gain);
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(1.2, t0 + 0.25);
  env.gain.setValueAtTime(1.2, t0 + dur - 0.4);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(lp); lp.connect(am); am.connect(env); env.connect(canalEfeitos);
  src.start(t0); lfo.start(t0); src.stop(t0 + dur); lfo.stop(t0 + dur);
}

const ARPEJO = (notas, passo, dur, ganho, tipo = 'sine') => {
  const t0 = ac.currentTime + 0.02;
  notas.forEach((m, i) => nota(m, t0 + i * passo, dur, ganho, tipo, canalEfeitos));
};

export function efeito(nome) {
  if (!ac || !querSons || ac.state !== 'running') return;
  switch (nome) {
    case 'sino': ARPEJO([84, 88, 91, 96], 0.13, 1.6, 0.22); break;          // fim do foco
    case 'fimPausa': ARPEJO([79, 84], 0.16, 1.2, 0.18); break;
    case 'moeda': ARPEJO([83, 88], 0.07, 0.25, 0.06, 'square'); break;
    case 'pop': ARPEJO([79], 0, 0.12, 0.12); break;
    case 'nao': ARPEJO([70, 66], 0.1, 0.25, 0.1, 'triangle'); break;
    case 'giro': ARPEJO([72, 76, 79, 84], 0.06, 0.4, 0.12, 'triangle'); break;
    case 'festa': ARPEJO([72, 76, 79, 84, 88, 91], 0.07, 0.6, 0.12, 'triangle'); break;
    case 'ronrom': ronrom(2.2); break;
    case 'ronromCurto': ronrom(1.1); break;
  }
}
