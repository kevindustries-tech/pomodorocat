// Todos os textos do jogo em português, espanhol e inglês.
// t('chave', { vars }) devolve o texto no idioma atual; entrada que depende do gênero do gato é
// uma função que recebe { g: 'm' | 'f', ... }. Faltou tradução? Cai no português.
// Nomes de itens do catálogo ficam em NOMES (o português é o `nome` do próprio catálogo).

export const IDIOMAS = { pt: 'Português', es: 'Español', en: 'English' };
let atual = 'pt';
export const idioma = () => atual;
export function definirIdioma(l) {
  atual = IDIOMAS[l] ? l : 'pt';
  document.documentElement.lang = { pt: 'pt-BR', es: 'es', en: 'en' }[atual];
}
export function detectarIdioma() {
  const l = String(navigator.language || 'pt').slice(0, 2).toLowerCase();
  return IDIOMAS[l] ? l : 'pt';
}

const ao = v => (v.g === 'f' ? 'a' : 'o');        // terminação por gênero (pt e es)
const plural = (n, um, varios) => (n === 1 ? um : varios);

const D = {
  pt: {
    // adoção
    'adocao.sub': 'Vamos adotar seu gatinho?', 'adocao.nome': 'Nome', 'adocao.exNome': 'Ex.: Mimi',
    'adocao.genero': 'Menino ou menina?', 'adocao.menino': 'Menino', 'adocao.menina': 'Menina',
    'adocao.cor': 'Cor', 'adocao.pelo': 'Pelo', 'adocao.adotar': 'Adotar 🐾',
    'pelo.curto': 'Curto', 'pelo.medio': 'Médio', 'pelo.longo': 'Longo',
    // navegação
    'nav.comida': 'Comida', 'nav.loja': 'Loja', 'nav.tarefas': 'Tarefas', 'nav.moedas': 'Moedas', 'nav.ajustes': 'Ajustes',
    'nivelCurto': 'Nv {n}', 'fechar': 'Fechar', 'quarto': 'Quarto do gatinho',
    // timer
    'timer.parado': 'Hora de focar?', 'timer.focando': 'Focando… {nome} lê com você', 'timer.focandoSo': 'Focando…', 'timer.focoPausado': 'Foco pausado',
    'timer.fimFoco': 'Foco feito! Hora da pausa ☕', 'timer.pausa': 'Pausa — estica as pernas!', 'timer.pausaParada': 'Pausa parada',
    'bt.comecar': '▶ Focar', 'bt.pausar': '⏸ Pausar', 'bt.continuar': '▶ Seguir', 'bt.desistir': 'Desistir',
    'bt.pausa': '☕ Pausa', 'bt.pular': 'Pular', 'bt.encerrar': 'Encerrar', 'bt.certeza': 'Toque de novo',
    'tarefa.escolher': '＋ tarefa',
    // alertas
    'alerta.doente': v => `${v.nome} está dodói.`, 'alerta.grave': '{nome} precisa ir ao médico.',
    'alerta.morto': '{nome} virou estrelinha ⭐', 'alerta.areia': 'A caixa de areia está suja.',
    'bt.remedio': '💊 Remédio', 'bt.medico': '🏥 Médico', 'bt.elixir': '✨ Elixir', 'bt.gema': '💎 Gema', 'bt.limpar': '🧹 Limpar',
    // falas
    'fala.grave': 'Me leva no médico? 🏥', 'fala.doente': 'Tô dodói… preciso de remédio 💊', 'fala.choraMuito': 'Buáá… cadê você?',
    'fala.chora': 'Senti sua falta ontem…', 'fala.fome': 'Tô com fominha…', 'fala.areia': 'Troca minha areia? 🧹',
    'fala.focar': 'Vamos focar! 📖', 'fala.desistiu': 'Tudo bem, a gente tenta de novo 💛',
    'fala.moeda': v => `Oba! +${v.n} moeda${plural(v.n, '', 's')} 🪙`, 'fala.teto': 'Foco feito! (moedas de hoje acabaram)',
    'fala.maisUm': 'Bora mais um? 💪', 'fala.cheiroso': 'Cheirosinho! ✨', 'fala.voltei': 'Voltei! 💛',
    'fala.melhor': v => `Obrigad${ao(v)}! Já tô melhor 💛`, 'fala.oi': 'Oi! Eu sou {nome} 💛', 'fala.areiaLimpa': 'A areia tá limpinha!',
    'aviso.tarefa': '🍅 +1 em “{t}”', 'aviso.xp': '+{n} XP', 'aviso.comprou': '{item} ✓', 'aviso.dias': 'Dias sem pomodoro: {n}',
    'aviso.nuvemVeio': '{nome} veio da nuvem ☁️',
    // erros do jogo
    'erro.morto': '{nome} precisa do elixir primeiro.', 'erro.bloqueado': 'Ainda não foi liberado.',
    'erro.cheio': v => `${v.nome} está cheinh${ao(v)}! Volta mais tarde.`,
    'erro.faltam': v => plural(v.n, 'Falta 1 moeda.', `Faltam ${v.n} moedas.`), 'erro.naoCompra': 'Não dá para comprar isso.',
    'erro.nivel': 'Libera no nível {n}.', 'erro.naoPrecisa': 'Não precisa disso agora.', 'erro.limpa': 'A areia ainda está limpinha.',
    // comida
    'comida.titulo': 'Comidinhas', 'comida.barriga': 'barriguinha', 'reacao.1': 'ronrona', 'reacao.2': 'gira no ar', 'reacao.3': 'dancinha',
    'trancado': '🔒 nível {n}',
    // loja
    'loja.titulo': 'Loja', 'loja.dica': 'cada nível novo libera mais 1 de cada',
    'loja.moveis': 'Móveis', 'loja.paredes': 'Paredes', 'loja.roupas': 'Roupinhas', 'loja.usando': 'Usando ✓', 'loja.usar': 'Usar',
    // gato
    'gato.resumo': v => `${v.g === 'f' ? 'Gatinha' : 'Gatinho'} ${v.cor.toLowerCase()} · nível ${v.nivel} · ${v.xp}/${v.max} XP`,
    'gato.barriga': 'Barriguinha', 'gato.alegria': 'Alegria', 'gato.saude': 'Saúde',
    'saude.ok': 'Saudável 💚', 'saude.doente': 'Dodói 🤒', 'saude.grave': 'Precisa de médico 🏥', 'saude.morto': 'Virou estrelinha ⭐',
    'gato.diasSem': 'Dias sem pomodoro', 'gato.restante': 'Moedas que ainda dá pra ganhar hoje', 'gato.total': 'Pomodoros no total',
    'gato.cuidados': 'Cuidados', 'gato.limparAreia': '🧹 Limpar areia', 'gato.comoCuidar': 'Como cuidar',
    'gato.regra1': v => `Cada pomodoro de ${v.foco} min vale 1 moeda (até ${v.teto} por dia). Comida de 1 moeda: ${v.g === 'f' ? 'ela' : 'ele'} ronrona; de 2: gira no ar; de 3: dancinha. Alimentar e limpar a areia dão ${v.xp} XP; a cada ${v.max} XP sobe de nível.`,
    'gato.regra2': v => `Sem pomodoro: ${v.chora} dia, ${v.g === 'f' ? 'ela' : 'ele'} chora; ${v.choraMuito} dias, chora mais; ${v.doente} dias, fica dodói (remédio); ${v.grave} dias, precisa de médico; ${v.morre} dias, vira estrelinha (elixir).`,
    'emBreve': 'Em breve', 'gato.breve': 'Passeios a partir do nível {passeio} e um cômodo novo a cada {comodo} níveis.',
    // tarefas
    'tarefas.titulo': 'Tarefas', 'tarefas.placeholder': 'O que você vai fazer?', 'tarefas.feitas': 'Feitas',
    'tarefas.dica': '📌 = a tarefa do próximo pomodoro. Cada foco concluído soma um 🍅 nela.', 'tarefas.vazio': 'Nenhuma tarefa ainda.',
    'tarefas.marcar': 'Marcar como feita', 'tarefas.focar': 'Focar nesta', 'tarefas.apagar': 'Apagar',
    // ajustes
    'ajustes.titulo': 'Ajustes', 'ajustes.idioma': 'Idioma', 'ajustes.musica': 'Musiquinha', 'ajustes.sons': 'Sons',
    'ajustes.pausar': 'Deixar pausar o pomodoro', 'ajustes.tela': 'Manter a tela acesa no foco',
    'ajustes.telaDica': 'Com a tela apagada o celular não deixa o alarme tocar.',
    'vip.tempo': 'Escolher o tempo do pomodoro', 'vip.pausaLonga': 'Pausa longa a cada {n}', 'vip.graficos': 'Dias seguidos e gráficos',
    'vip.breve': 'Em breve.', 'ajustes.sobre': 'Sobre', 'ajustes.versao': 'Study Cat {v} · versão de teste.',
    'ajustes.apagar': 'Apagar tudo e recomeçar',
    'conta.titulo': 'Conta', 'conta.como': 'Conta: {email}', 'conta.sair': 'Sair da conta', 'conta.semNuvem': 'Sem conta: o progresso fica só neste aparelho.',
    'conta.sincronizado': 'O progresso tem cópia na nuvem ☁️',
    // nível
    'nivel.titulo': 'Nível {n}! 🎉', 'nivel.novidades': 'Chegou coisa nova na loja:', 'nivel.passeio': 'Passeios liberados (em breve!)',
    'nivel.comodo': 'Você poderá escolher um cômodo novo (em breve!)', 'nivel.oba': 'Oba!',
    // tela da conta
    'login.titulo': 'Sua conta', 'login.sub': 'Crie uma conta para seu gatinho não se perder se você trocar de celular.',
    'login.criar': 'Criar conta', 'login.tenho': 'Já tenho conta', 'login.email': 'E-mail', 'login.senha': 'Senha',
    'login.senha2': 'Repita a senha', 'login.entrar': 'Entrar', 'login.criando': 'Criando…', 'login.entrando': 'Entrando…',
    'login.senhaDica': 'Pelo menos 6 caracteres.',
    'login.e.email': 'Esse e-mail não parece válido.', 'login.e.exemplo': 'Use o seu e-mail de verdade.',
    'login.e.curta': 'A senha precisa de pelo menos 6 caracteres.', 'login.e.diferentes': 'As senhas não estão iguais.',
    'login.e.errada': 'E-mail ou senha errados.', 'login.e.existe': 'Já existe conta com esse e-mail. Toque em “Já tenho conta”.',
    'login.e.confirmar': 'Confirme o e-mail antes de entrar.', 'login.e.muitas': 'Muitas tentativas seguidas, espere um minuto.',
    'login.e.rede': 'Sem conexão com o servidor. Tente de novo.',
  },

  es: {
    'adocao.sub': '¿Adoptamos a tu gatito?', 'adocao.nome': 'Nombre', 'adocao.exNome': 'Ej.: Mimi',
    'adocao.genero': '¿Niño o niña?', 'adocao.menino': 'Niño', 'adocao.menina': 'Niña',
    'adocao.cor': 'Color', 'adocao.pelo': 'Pelo', 'adocao.adotar': 'Adoptar 🐾',
    'pelo.curto': 'Corto', 'pelo.medio': 'Medio', 'pelo.longo': 'Largo',
    'nav.comida': 'Comida', 'nav.loja': 'Tienda', 'nav.tarefas': 'Tareas', 'nav.moedas': 'Monedas', 'nav.ajustes': 'Ajustes',
    'nivelCurto': 'Nv {n}', 'fechar': 'Cerrar', 'quarto': 'Cuarto del gatito',
    'timer.parado': '¿A concentrarse?', 'timer.focando': 'Enfocando… {nome} lee contigo', 'timer.focandoSo': 'Enfocando…', 'timer.focoPausado': 'Pausado',
    'timer.fimFoco': '¡Listo! Hora del descanso ☕', 'timer.pausa': 'Descanso — ¡estira las piernas!', 'timer.pausaParada': 'Descanso pausado',
    'bt.comecar': '▶ Empezar', 'bt.pausar': '⏸ Pausar', 'bt.continuar': '▶ Seguir', 'bt.desistir': 'Rendirse',
    'bt.pausa': '☕ Descanso', 'bt.pular': 'Saltar', 'bt.encerrar': 'Terminar', 'bt.certeza': 'Toca otra vez',
    'tarefa.escolher': '＋ tarea',
    'alerta.doente': v => `${v.nome} está enfermit${ao(v)}.`, 'alerta.grave': '{nome} necesita ir al veterinario.',
    'alerta.morto': '{nome} se volvió estrellita ⭐', 'alerta.areia': 'El arenero está sucio.',
    'bt.remedio': '💊 Medicina', 'bt.medico': '🏥 Veterinario', 'bt.elixir': '✨ Elixir', 'bt.gema': '💎 Gema', 'bt.limpar': '🧹 Limpiar',
    'fala.grave': '¿Me llevas al veterinario? 🏥', 'fala.doente': v => `Estoy malit${ao(v)}… necesito medicina 💊`, 'fala.choraMuito': 'Buaa… ¿dónde estás?',
    'fala.chora': 'Te extrañé ayer…', 'fala.fome': 'Tengo hambrecita…', 'fala.areia': '¿Me cambias la arena? 🧹',
    'fala.focar': '¡A concentrarnos! 📖', 'fala.desistiu': 'Tranqui, lo intentamos de nuevo 💛',
    'fala.moeda': v => `¡Bien! +${v.n} moneda${plural(v.n, '', 's')} 🪙`, 'fala.teto': '¡Listo! (se acabaron las monedas de hoy)',
    'fala.maisUm': '¿Otro más? 💪', 'fala.cheiroso': '¡Limpito! ✨', 'fala.voltei': '¡Volví! 💛',
    'fala.melhor': '¡Gracias! Ya estoy mejor 💛', 'fala.oi': '¡Hola! Soy {nome} 💛', 'fala.areiaLimpa': '¡La arena está limpita!',
    'aviso.tarefa': '🍅 +1 en “{t}”', 'aviso.xp': '+{n} XP', 'aviso.comprou': '{item} ✓', 'aviso.dias': 'Días sin pomodoro: {n}',
    'aviso.nuvemVeio': '{nome} vino de la nube ☁️',
    'erro.morto': '{nome} necesita el elixir primero.', 'erro.bloqueado': 'Todavía está bloqueado.',
    'erro.cheio': v => `¡${v.nome} está llenit${ao(v)}! Vuelve más tarde.`,
    'erro.faltam': v => plural(v.n, 'Te falta 1 moneda.', `Te faltan ${v.n} monedas.`), 'erro.naoCompra': 'No se puede comprar.',
    'erro.nivel': 'Se desbloquea en el nivel {n}.', 'erro.naoPrecisa': 'No lo necesita ahora.', 'erro.limpa': 'La arena todavía está limpia.',
    'comida.titulo': 'Comiditas', 'comida.barriga': 'pancita', 'reacao.1': 'ronronea', 'reacao.2': 'gira en el aire', 'reacao.3': 'bailecito',
    'trancado': '🔒 nivel {n}',
    'loja.titulo': 'Tienda', 'loja.dica': 'cada nivel nuevo desbloquea 1 más de cada',
    'loja.moveis': 'Muebles', 'loja.paredes': 'Paredes', 'loja.roupas': 'Ropita', 'loja.usando': 'Usando ✓', 'loja.usar': 'Usar',
    'gato.resumo': v => `${v.g === 'f' ? 'Gatita' : 'Gatito'} ${v.cor.toLowerCase()} · nivel ${v.nivel} · ${v.xp}/${v.max} XP`,
    'gato.barriga': 'Pancita', 'gato.alegria': 'Alegría', 'gato.saude': 'Salud',
    'saude.ok': v => `San${ao(v)} 💚`, 'saude.doente': v => `Enfermit${ao(v)} 🤒`, 'saude.grave': 'Necesita veterinario 🏥', 'saude.morto': 'Se volvió estrellita ⭐',
    'gato.diasSem': 'Días sin pomodoro', 'gato.restante': 'Monedas que aún puedes ganar hoy', 'gato.total': 'Pomodoros en total',
    'gato.cuidados': 'Cuidados', 'gato.limparAreia': '🧹 Limpiar arena', 'gato.comoCuidar': 'Cómo cuidarlo',
    'gato.regra1': v => `Cada pomodoro de ${v.foco} min vale 1 moneda (hasta ${v.teto} por día). Comida de 1 moneda: ronronea; de 2: gira en el aire; de 3: bailecito. Alimentar y limpiar la arena dan ${v.xp} XP; cada ${v.max} XP sube de nivel.`,
    'gato.regra2': v => `Sin pomodoro: ${v.chora} día, llora; ${v.choraMuito} días, llora más; ${v.doente} días, se enferma (medicina); ${v.grave} días, necesita veterinario; ${v.morre} días, se vuelve estrellita (elixir).`,
    'emBreve': 'Muy pronto', 'gato.breve': 'Paseos desde el nivel {passeio} y un cuarto nuevo cada {comodo} niveles.',
    'tarefas.titulo': 'Tareas', 'tarefas.placeholder': '¿Qué vas a hacer?', 'tarefas.feitas': 'Hechas',
    'tarefas.dica': '📌 = la tarea del próximo pomodoro. Cada enfoque terminado le suma un 🍅.', 'tarefas.vazio': 'Todavía no hay tareas.',
    'tarefas.marcar': 'Marcar como hecha', 'tarefas.focar': 'Enfocarse en esta', 'tarefas.apagar': 'Borrar',
    'ajustes.titulo': 'Ajustes', 'ajustes.idioma': 'Idioma', 'ajustes.musica': 'Musiquita', 'ajustes.sons': 'Sonidos',
    'ajustes.pausar': 'Permitir pausar el pomodoro', 'ajustes.tela': 'Pantalla encendida al enfocar',
    'ajustes.telaDica': 'Con la pantalla apagada el celular no deja sonar la alarma.',
    'vip.tempo': 'Elegir la duración del pomodoro', 'vip.pausaLonga': 'Descanso largo cada {n}', 'vip.graficos': 'Rachas y gráficos',
    'vip.breve': 'Muy pronto.', 'ajustes.sobre': 'Acerca de', 'ajustes.versao': 'Study Cat {v} · versión de prueba.',
    'ajustes.apagar': 'Borrar todo y empezar de nuevo',
    'conta.titulo': 'Cuenta', 'conta.como': 'Cuenta: {email}', 'conta.sair': 'Cerrar sesión', 'conta.semNuvem': 'Sin cuenta: el progreso queda solo en este celular.',
    'conta.sincronizado': 'El progreso tiene copia en la nube ☁️',
    'nivel.titulo': '¡Nivel {n}! 🎉', 'nivel.novidades': 'Hay cosas nuevas en la tienda:', 'nivel.passeio': 'Paseos desbloqueados (¡muy pronto!)',
    'nivel.comodo': 'Podrás elegir un cuarto nuevo (¡muy pronto!)', 'nivel.oba': '¡Bien!',
    'login.titulo': 'Tu cuenta', 'login.sub': 'Crea una cuenta para que tu gatito no se pierda si cambias de celular.',
    'login.criar': 'Crear cuenta', 'login.tenho': 'Ya tengo cuenta', 'login.email': 'Correo', 'login.senha': 'Contraseña',
    'login.senha2': 'Repite la contraseña', 'login.entrar': 'Entrar', 'login.criando': 'Creando…', 'login.entrando': 'Entrando…',
    'login.senhaDica': 'Al menos 6 caracteres.',
    'login.e.email': 'Ese correo no parece válido.', 'login.e.exemplo': 'Usa tu correo de verdad.',
    'login.e.curta': 'La contraseña necesita al menos 6 caracteres.', 'login.e.diferentes': 'Las contraseñas no coinciden.',
    'login.e.errada': 'Correo o contraseña incorrectos.', 'login.e.existe': 'Ya existe una cuenta con ese correo. Toca “Ya tengo cuenta”.',
    'login.e.confirmar': 'Confirma tu correo antes de entrar.', 'login.e.muitas': 'Demasiados intentos, espera un minuto.',
    'login.e.rede': 'Sin conexión con el servidor. Inténtalo de nuevo.',
  },

  en: {
    'adocao.sub': "Let's adopt your kitty!", 'adocao.nome': 'Name', 'adocao.exNome': 'E.g.: Mimi',
    'adocao.genero': 'Boy or girl?', 'adocao.menino': 'Boy', 'adocao.menina': 'Girl',
    'adocao.cor': 'Color', 'adocao.pelo': 'Fur', 'adocao.adotar': 'Adopt 🐾',
    'pelo.curto': 'Short', 'pelo.medio': 'Medium', 'pelo.longo': 'Long',
    'nav.comida': 'Food', 'nav.loja': 'Shop', 'nav.tarefas': 'Tasks', 'nav.moedas': 'Coins', 'nav.ajustes': 'Settings',
    'nivelCurto': 'Lv {n}', 'fechar': 'Close', 'quarto': "Kitty's room",
    'timer.parado': 'Ready to focus?', 'timer.focando': 'Focusing… {nome} is reading with you', 'timer.focandoSo': 'Focusing…', 'timer.focoPausado': 'Focus paused',
    'timer.fimFoco': 'Done! Break time ☕', 'timer.pausa': 'Break — stretch your legs!', 'timer.pausaParada': 'Break paused',
    'bt.comecar': '▶ Focus', 'bt.pausar': '⏸ Pause', 'bt.continuar': '▶ Resume', 'bt.desistir': 'Give up',
    'bt.pausa': '☕ Break', 'bt.pular': 'Skip', 'bt.encerrar': 'End', 'bt.certeza': 'Tap again',
    'tarefa.escolher': '＋ task',
    'alerta.doente': '{nome} is sick.', 'alerta.grave': '{nome} needs the vet.',
    'alerta.morto': '{nome} became a little star ⭐', 'alerta.areia': 'The litter box is dirty.',
    'bt.remedio': '💊 Medicine', 'bt.medico': '🏥 Vet', 'bt.elixir': '✨ Elixir', 'bt.gema': '💎 Gem', 'bt.limpar': '🧹 Clean',
    'fala.grave': 'Take me to the vet? 🏥', 'fala.doente': "I'm sick… I need medicine 💊", 'fala.choraMuito': 'Waaah… where are you?',
    'fala.chora': 'I missed you yesterday…', 'fala.fome': "I'm a little hungry…", 'fala.areia': 'Change my litter? 🧹',
    'fala.focar': "Let's focus! 📖", 'fala.desistiu': "It's okay, we'll try again 💛",
    'fala.moeda': v => `Yay! +${v.n} coin${plural(v.n, '', 's')} 🪙`, 'fala.teto': 'Done! (no more coins today)',
    'fala.maisUm': 'One more? 💪', 'fala.cheiroso': 'So fresh! ✨', 'fala.voltei': "I'm back! 💛",
    'fala.melhor': 'Thank you! I feel better 💛', 'fala.oi': "Hi! I'm {nome} 💛", 'fala.areiaLimpa': 'The litter is clean!',
    'aviso.tarefa': '🍅 +1 on “{t}”', 'aviso.xp': '+{n} XP', 'aviso.comprou': '{item} ✓', 'aviso.dias': 'Days without pomodoro: {n}',
    'aviso.nuvemVeio': '{nome} came back from the cloud ☁️',
    'erro.morto': '{nome} needs the elixir first.', 'erro.bloqueado': 'Not unlocked yet.',
    'erro.cheio': "{nome} is full! Come back later.",
    'erro.faltam': v => plural(v.n, 'You need 1 more coin.', `You need ${v.n} more coins.`), 'erro.naoCompra': "You can't buy that.",
    'erro.nivel': 'Unlocks at level {n}.', 'erro.naoPrecisa': 'Not needed right now.', 'erro.limpa': 'The litter is still clean.',
    'comida.titulo': 'Snacks', 'comida.barriga': 'tummy', 'reacao.1': 'purrs', 'reacao.2': 'spins', 'reacao.3': 'dances',
    'trancado': '🔒 level {n}',
    'loja.titulo': 'Shop', 'loja.dica': 'each new level unlocks 1 more of each',
    'loja.moveis': 'Furniture', 'loja.paredes': 'Walls', 'loja.roupas': 'Outfits', 'loja.usando': 'Using ✓', 'loja.usar': 'Use',
    'gato.resumo': v => `${v.cor} kitty · level ${v.nivel} · ${v.xp}/${v.max} XP`,
    'gato.barriga': 'Tummy', 'gato.alegria': 'Happiness', 'gato.saude': 'Health',
    'saude.ok': 'Healthy 💚', 'saude.doente': 'Sick 🤒', 'saude.grave': 'Needs the vet 🏥', 'saude.morto': 'Became a little star ⭐',
    'gato.diasSem': 'Days without pomodoro', 'gato.restante': 'Coins you can still earn today', 'gato.total': 'Total pomodoros',
    'gato.cuidados': 'Care', 'gato.limparAreia': '🧹 Clean litter', 'gato.comoCuidar': 'How to take care',
    'gato.regra1': v => `Each ${v.foco}-minute pomodoro is worth 1 coin (up to ${v.teto} a day). 1-coin food: ${v.g === 'f' ? 'she' : 'he'} purrs; 2 coins: spins in the air; 3 coins: a little dance. Feeding and cleaning the litter give ${v.xp} XP; every ${v.max} XP is a new level.`,
    'gato.regra2': v => `Without pomodoros: ${v.chora} day, ${v.g === 'f' ? 'she' : 'he'} cries; ${v.choraMuito} days, cries more; ${v.doente} days, gets sick (medicine); ${v.grave} days, needs the vet; ${v.morre} days, becomes a little star (elixir).`,
    'emBreve': 'Coming soon', 'gato.breve': 'Walks from level {passeio} and a new room every {comodo} levels.',
    'tarefas.titulo': 'Tasks', 'tarefas.placeholder': 'What will you do?', 'tarefas.feitas': 'Done',
    'tarefas.dica': '📌 = the task for the next pomodoro. Each finished focus adds a 🍅 to it.', 'tarefas.vazio': 'No tasks yet.',
    'tarefas.marcar': 'Mark as done', 'tarefas.focar': 'Focus on this one', 'tarefas.apagar': 'Delete',
    'ajustes.titulo': 'Settings', 'ajustes.idioma': 'Language', 'ajustes.musica': 'Music', 'ajustes.sons': 'Sounds',
    'ajustes.pausar': 'Allow pausing the pomodoro', 'ajustes.tela': 'Keep the screen on while focusing',
    'ajustes.telaDica': "With the screen off, the phone won't let the alarm ring.",
    'vip.tempo': 'Choose the pomodoro length', 'vip.pausaLonga': 'Long break every {n}', 'vip.graficos': 'Streaks and charts',
    'vip.breve': 'Coming soon.', 'ajustes.sobre': 'About', 'ajustes.versao': 'Study Cat {v} · test version.',
    'ajustes.apagar': 'Erase everything and start over',
    'conta.titulo': 'Account', 'conta.como': 'Account: {email}', 'conta.sair': 'Sign out', 'conta.semNuvem': 'No account: progress stays only on this device.',
    'conta.sincronizado': 'Your progress is backed up in the cloud ☁️',
    'nivel.titulo': 'Level {n}! 🎉', 'nivel.novidades': 'New things in the shop:', 'nivel.passeio': 'Walks unlocked (coming soon!)',
    'nivel.comodo': "You'll be able to pick a new room (coming soon!)", 'nivel.oba': 'Yay!',
    'login.titulo': 'Your account', 'login.sub': "Create an account so your kitty isn't lost if you change phones.",
    'login.criar': 'Sign up', 'login.tenho': 'I have an account', 'login.email': 'Email', 'login.senha': 'Password',
    'login.senha2': 'Repeat the password', 'login.entrar': 'Sign in', 'login.criando': 'Creating…', 'login.entrando': 'Signing in…',
    'login.senhaDica': 'At least 6 characters.',
    'login.e.email': "That email doesn't look valid.", 'login.e.exemplo': 'Please use your real email.',
    'login.e.curta': 'The password needs at least 6 characters.', 'login.e.diferentes': "The passwords don't match.",
    'login.e.errada': 'Wrong email or password.', 'login.e.existe': 'There is already an account with this email. Tap “I have an account”.',
    'login.e.confirmar': 'Confirm your email before signing in.', 'login.e.muitas': 'Too many attempts, wait a minute.',
    'login.e.rede': 'No connection to the server. Try again.',
  },
};

export function t(chave, v = {}) {
  const s = D[atual][chave] ?? D.pt[chave] ?? chave;
  if (typeof s === 'function') return s(v);
  return s.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
}

// ---------- nomes do catálogo ----------
const NOMES = {
  es: {
    leite: 'Tazón de leche', peixe: 'Pescado', banquete: 'Banquete', maca: 'Manzana', sushi: 'Sushi', bolo: 'Pastel de chocolate',
    cafe: 'Café', onigiri: 'Onigiri', peru: 'Pavo asado', cha: 'Té verde', milkshake: 'Malteada', lasanha: 'Lasaña',
    banana: 'Plátano', brigadeiro: 'Brigadeiro', feijoada: 'Feijoada', uva: 'Uvas', batata: 'Papas fritas', costela: 'Costillas',
    melancia: 'Sandía', macarrao: 'Pasta', strogonoff: 'Strogonoff', abacaxi: 'Piña', pudim: 'Flan', coco: 'Coco',
    torta: 'Tarta', bala: 'Caramelo', taco: 'Taco', pirulito: 'Paleta', kebab: 'Kebab', chocolate: 'Chocolate',
    temaki: 'Temaki', salada: 'Ensalada', salgadinho: 'Nachos',
    'parede-creme': 'Crema (cuarto básico)', 'janela-simples': 'Ventana sencilla', 'prateleira-simples': 'Repisa', 'areia-basica': 'Arenero',
    'cama-simples': 'Camita sencilla', 'estante-livros': 'Librero', 'tapete-redondo': 'Alfombra redonda', 'abajur': 'Lámpara',
    'quadro-paisagem': 'Cuadro de paisaje', 'planta': 'Plantita', 'lustre': 'Lámpara de techo', 'cortina-rosa': 'Ventana con cortina rosa',
    'areia-rosa': 'Arenero rosa', 'cama-nuvem': 'Camita de nube', 'quadro-peixe': 'Cuadro de pececito', 'tapete-coracao': 'Alfombra de corazón',
    'janela-redonda': 'Ventana redonda', 'cortina-lilas': 'Ventana con cortina lila', 'areia-casinha': 'Casita arenero',
    'laco-rosa': 'Moño rosa', 'coleira-sino': 'Collar con cascabel', 'oculos-redondo': 'Lentes redondos', 'chapeu-palha': 'Sombrero de paja',
    'lenco-azul': 'Pañuelito azul', 'gorro': 'Gorro de dormir', 'sueter': 'Suéter a rayas', 'fone': 'Audífonos',
    'gravata': 'Corbata de moño', 'coroa-flores': 'Corona de flores', 'oculos-coracao': 'Lentes de corazón', 'chapeu-chef': 'Gorro de chef',
  },
  en: {
    leite: 'Bowl of milk', peixe: 'Fish', banquete: 'Feast', maca: 'Apple', sushi: 'Sushi', bolo: 'Chocolate cake',
    cafe: 'Coffee', onigiri: 'Onigiri', peru: 'Roast turkey', cha: 'Green tea', milkshake: 'Milkshake', lasanha: 'Lasagna',
    banana: 'Banana', brigadeiro: 'Brigadeiro', feijoada: 'Feijoada', uva: 'Grapes', batata: 'French fries', costela: 'Ribs',
    melancia: 'Watermelon', macarrao: 'Pasta', strogonoff: 'Stroganoff', abacaxi: 'Pineapple', pudim: 'Flan', coco: 'Coconut',
    torta: 'Pie', bala: 'Candy', taco: 'Taco', pirulito: 'Lollipop', kebab: 'Kebab', chocolate: 'Chocolate',
    temaki: 'Temaki', salada: 'Salad', salgadinho: 'Corn chips',
    'parede-creme': 'Cream (basic room)', 'janela-simples': 'Simple window', 'prateleira-simples': 'Shelf', 'areia-basica': 'Litter box',
    'cama-simples': 'Simple bed', 'estante-livros': 'Bookcase', 'tapete-redondo': 'Round rug', 'abajur': 'Floor lamp',
    'quadro-paisagem': 'Landscape painting', 'planta': 'Little plant', 'lustre': 'Ceiling lamp', 'cortina-rosa': 'Window with pink curtains',
    'areia-rosa': 'Pink litter box', 'cama-nuvem': 'Cloud bed', 'quadro-peixe': 'Fish painting', 'tapete-coracao': 'Heart rug',
    'janela-redonda': 'Round window', 'cortina-lilas': 'Window with lilac curtains', 'areia-casinha': 'Litter house',
    'laco-rosa': 'Pink bow', 'coleira-sino': 'Bell collar', 'oculos-redondo': 'Round glasses', 'chapeu-palha': 'Straw hat',
    'lenco-azul': 'Blue bandana', 'gorro': 'Nightcap', 'sueter': 'Striped sweater', 'fone': 'Headphones',
    'gravata': 'Bow tie', 'coroa-flores': 'Flower crown', 'oculos-coracao': 'Heart glasses', 'chapeu-chef': 'Chef hat',
  },
};
// Papel de parede: o nome sai da cor + estampa, então não precisa listar os 27.
const CORES = {
  es: { rosa: 'rosa', azul: 'azul', verde: 'verde', lilas: 'lila', amarelo: 'amarillo', marrom: 'marrón', bege: 'beige', cinza: 'gris', preto: 'negro' },
  en: { rosa: 'pink', azul: 'blue', verde: 'green', lilas: 'lilac', amarelo: 'yellow', marrom: 'brown', bege: 'beige', cinza: 'gray', preto: 'black' },
};
const LISO = {
  es: { rosa: 'Rosa liso', azul: 'Azul liso', verde: 'Verde claro', lilas: 'Lila', amarelo: 'Amarillo claro', marrom: 'Marrón', bege: 'Beige', cinza: 'Gris' },
  en: { rosa: 'Plain pink', azul: 'Plain blue', verde: 'Light green', lilas: 'Lilac', amarelo: 'Light yellow', marrom: 'Brown', bege: 'Beige', cinza: 'Gray' },
};
const ESTAMPA = {
  es: { listras: c => `Blanco con rayas (${c})`, bolinhas: c => `Blanco con lunares (${c})`, coracoes: c => `Blanco con corazoncitos (${c})` },
  en: { listras: c => `White with ${c} stripes`, bolinhas: c => `White with ${c} polka dots`, coracoes: c => `White with little ${c} hearts` },
};
const EXTRA = { es: { 'parede-preto-listra': 'Negro con rayas blancas' }, en: { 'parede-preto-listra': 'Black with white stripes' } };

export function nomeItem(it) {
  if (atual === 'pt' || !it) return it?.nome;
  const l = atual;
  if (NOMES[l][it.id]) return NOMES[l][it.id];
  if (EXTRA[l][it.id]) return EXTRA[l][it.id];
  if (it.slot === 'parede' && it.cor) return it.padrao === 'liso' ? LISO[l][it.cor] : ESTAMPA[l][it.padrao](CORES[l][it.cor]);
  return it.nome;
}

const PELAGENS_NOME = {
  es: { branco: 'Blanco', preto: 'Negro', cinza: 'Gris', marrom: 'Marrón', bege: 'Beige', laranja: 'Naranja', frajola: 'Blanco y negro',
    rajadoCinza: 'Atigrado gris', rajadoLaranja: 'Atigrado naranja', tricolor: 'Tricolor', siames: 'Siamés' },
  en: { branco: 'White', preto: 'Black', cinza: 'Gray', marrom: 'Brown', bege: 'Beige', laranja: 'Orange', frajola: 'Tuxedo',
    rajadoCinza: 'Gray tabby', rajadoLaranja: 'Orange tabby', tricolor: 'Calico', siames: 'Siamese' },
};
export const nomePelagem = (chave, nomePt) => (atual === 'pt' ? nomePt : PELAGENS_NOME[atual][chave] || nomePt);

// Textos fixos do HTML: data-t = texto, data-tp = placeholder, data-ta = aria-label.
export function traduzirPagina(raiz = document) {
  for (const el of raiz.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  for (const el of raiz.querySelectorAll('[data-tp]')) el.placeholder = t(el.dataset.tp);
  for (const el of raiz.querySelectorAll('[data-ta]')) el.setAttribute('aria-label', t(el.dataset.ta));
}
