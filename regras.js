// Todas as regras do jogo num lugar só. Mudou uma regra? É aqui — o resto do código só lê.
// Os números com (Bianca) são decisão dela; os outros são padrão meu, trocáveis.

export const R = {
  focoMin: 25, pausaMin: 5,                    // (Bianca) grátis é sempre 25/5
  pausaLongaMin: 15, pausaLongaCada: 4,        // (Bianca) pausa longa só no VIP
  moedasPorPomodoro: 1,                        // (Bianca)
  tetoMoedasDia: 8,                            // sem teto, cinco timers compram o quarto numa tarde

  xpPorNivel: 100,                             // (Bianca)
  xp: { comer: 10, areia: 10, passeio: 30 },   // (Bianca)
  nivelPasseio: 5, comodoCadaNiveis: 5,        // (Bianca) — passeio e cômodos ainda não existem

  // Barriguinha e alegria vão de 0 a 100 e caem com o tempo, mesmo com o app fechado.
  horasFome: 14,        // de cheio a vazio
  horasAlegria: 24,
  fome: 30,             // abaixo disso ele pede comida
  cheio: 85,            // acima disso recusa
  enche:  { 1: 35, 2: 60, 3: 100 },            // quanto cada faixa de preço enche
  alegra: { 1: 15, 2: 30, 3: 50 },             // (Bianca) mais cara = mais feliz
  alegraAreia: 10,
  refeicoesSujamAreia: 2,

  // (Bianca) dias INTEIROS sem pomodoro. Fez pomodoro na segunda: terça ainda está tudo bem,
  // na quarta faz 1 dia sem. Remédio, médico e elixir também contam como cuidado e zeram a conta.
  saude: { chora: 1, choraMuito: 2, doente: 3, grave: 7, morre: 15 },
  precos: { remedio: 2, medico: 3, elixir: 5 }, // (Bianca) médico 3, elixir 5; remédio é meu
};
