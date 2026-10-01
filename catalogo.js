// Tudo o que existe para comprar. A ORDEM da lista é a ordem de liberação (regra da Bianca):
// os 3 primeiros de cada categoria já vêm no nível 1, e cada nível novo libera mais 1 de cada.
// Para mudar quando um item aparece, mude a posição dele na lista.

const escalonar = (lista, extra = {}) => lista.map((it, i) => ({ ...extra, ...it, nivel: i < 3 ? 1 : i - 1 }));

// preco 1 = ronrona · 2 = giro no ar · 3 = dancinha
// O ícone é emoji só enquanto não chega o pacote de arte.
export const COMIDAS = escalonar([
  { id: 'leite', nome: 'Pote de leite', icone: '🥛', preco: 1 },
  { id: 'peixe', nome: 'Peixe', icone: '🐟', preco: 2 },
  { id: 'banquete', nome: 'Banquete', icone: '🍱', preco: 3 },
  { id: 'maca', nome: 'Maçã', icone: '🍎', preco: 1 },
  { id: 'sushi', nome: 'Sushi', icone: '🍣', preco: 2 },
  { id: 'bolo', nome: 'Bolo de chocolate', icone: '🎂', preco: 3 },
  { id: 'cafe', nome: 'Café', icone: '☕', preco: 1 },
  { id: 'onigiri', nome: 'Oniguiri', icone: '🍙', preco: 2 },
  { id: 'peru', nome: 'Peru assado', icone: '🍗', preco: 3 },
  { id: 'cha', nome: 'Chá verde', icone: '🍵', preco: 1 },
  { id: 'milkshake', nome: 'Milkshake', icone: '🥤', preco: 2 },
  { id: 'lasanha', nome: 'Lasanha', icone: '🥘', preco: 3 },
  { id: 'banana', nome: 'Banana', icone: '🍌', preco: 1 },
  { id: 'brigadeiro', nome: 'Brigadeiro', icone: '🟤', preco: 2 },
  { id: 'feijoada', nome: 'Feijoada', icone: '🍲', preco: 3 },
  { id: 'uva', nome: 'Uva', icone: '🍇', preco: 1 },
  { id: 'batata', nome: 'Batata frita', icone: '🍟', preco: 2 },
  { id: 'costela', nome: 'Costela', icone: '🍖', preco: 3 },
  { id: 'melancia', nome: 'Melancia', icone: '🍉', preco: 1 },
  { id: 'macarrao', nome: 'Macarrão', icone: '🍝', preco: 2 },
  { id: 'strogonoff', nome: 'Strogonoff', icone: '🍛', preco: 3 },
  { id: 'abacaxi', nome: 'Abacaxi', icone: '🍍', preco: 1 },
  { id: 'pudim', nome: 'Pudim', icone: '🍮', preco: 2 },
  { id: 'coco', nome: 'Coco verde', icone: '🥥', preco: 1 },
  { id: 'torta', nome: 'Torta', icone: '🥧', preco: 2 },
  { id: 'bala', nome: 'Bala', icone: '🍬', preco: 1 },
  { id: 'taco', nome: 'Taco', icone: '🌮', preco: 2 },
  { id: 'pirulito', nome: 'Pirulito', icone: '🍭', preco: 1 },
  { id: 'kebab', nome: 'Kebab', icone: '🥙', preco: 2 },
  { id: 'chocolate', nome: 'Chocolate', icone: '🍫', preco: 1 },
  { id: 'temaki', nome: 'Temaki', icone: '🥢', preco: 2 },
  { id: 'salada', nome: 'Salada', icone: '🥗', preco: 1 },
  { id: 'salgadinho', nome: 'Salgadinho', icone: '🌽', preco: 2 },
]);

// Papéis de parede, na ordem da lista da Bianca. `base` = fundo, `cor2` = listra/bolinha/coração.
const CLARO = { rosa: '#f9d4dd', azul: '#d3e5f6', verde: '#d7edd3', lilas: '#e4d9f4', amarelo: '#fbf1c6', marrom: '#dcc2a8', bege: '#f0e2cd', cinza: '#e2e1e6' };
const FORTE = { rosa: '#f4b2c3', azul: '#a8cbee', verde: '#acd8a5', lilas: '#c9b6ec', amarelo: '#f3dc86', marrom: '#bf9a7c', bege: '#dcc5a2', cinza: '#c2c0cb', preto: '#554c5c' };
const NOME = { rosa: 'rosa', azul: 'azul', verde: 'verde', lilas: 'lilás', amarelo: 'amarela', marrom: 'marrom', bege: 'bege', cinza: 'cinza', preto: 'preta' };
const BRANCO = '#fffcf6';
const liso = (c, nome) => ({ id: `parede-${c}`, nome, cor: c, base: CLARO[c], padrao: 'liso', preco: 4 });
const listra = c => ({ id: `parede-listra-${c}`, nome: `Branco com listra ${NOME[c]}`, cor: c, base: BRANCO, cor2: FORTE[c], padrao: 'listras', preco: 5 });
const bolinha = c => ({ id: `parede-bolinha-${c}`, nome: `Branco com bolinha ${NOME[c]}`, cor: c, base: BRANCO, cor2: FORTE[c], padrao: 'bolinhas', preco: 5 });
const coracao = c => ({ id: `parede-coracao-${c}`, nome: `Branco com coraçõezinhos (${NOME[c]})`, cor: c, base: BRANCO, cor2: FORTE[c], padrao: 'coracoes', preco: 6 });

export const PAREDES = escalonar([
  liso('rosa', 'Rosa liso'), liso('azul', 'Azul liso'), liso('verde', 'Verde claro'),
  { id: 'parede-preto-listra', nome: 'Preto com listra branca', base: FORTE.preto, cor2: '#f3ece4', padrao: 'listras', preco: 6 },
  liso('lilas', 'Lilás'), liso('amarelo', 'Amarelo claro'), bolinha('preto'),
  liso('marrom', 'Marrom'), liso('bege', 'Bege'), liso('cinza', 'Cinza'),
  listra('azul'), listra('rosa'), listra('amarelo'), listra('verde'), listra('lilas'), listra('cinza'), listra('marrom'), listra('bege'),
  bolinha('azul'), bolinha('rosa'), bolinha('verde'), bolinha('lilas'), bolinha('amarelo'),
  coracao('rosa'), coracao('azul'), coracao('lilas'), coracao('verde'),
], { slot: 'parede' });

// Móveis. Cada `slot` é um lugar fixo do quarto: comprar outro do mesmo slot troca o que está lá.
export const MOVEIS = escalonar([
  { id: 'cama-simples', nome: 'Caminha simples', slot: 'cama', preco: 5 },
  { id: 'estante-livros', nome: 'Estante de livros', slot: 'estante', preco: 8 },
  { id: 'tapete-redondo', nome: 'Tapete redondo', slot: 'tapete', preco: 4 },
  { id: 'abajur', nome: 'Abajur', slot: 'abajur', preco: 6 },
  { id: 'quadro-paisagem', nome: 'Quadro de paisagem', slot: 'quadro', preco: 5 },
  { id: 'planta', nome: 'Plantinha', slot: 'planta', preco: 5 },
  { id: 'lustre', nome: 'Lustre', slot: 'lustre', preco: 8 },
  { id: 'cortina-rosa', nome: 'Janela com cortina rosa', slot: 'janela', preco: 7 },
  { id: 'areia-rosa', nome: 'Caixa de areia rosa', slot: 'areia', preco: 6 },
  { id: 'cama-nuvem', nome: 'Caminha de nuvem', slot: 'cama', preco: 9 },
  { id: 'quadro-peixe', nome: 'Quadro de peixinho', slot: 'quadro', preco: 5 },
  { id: 'tapete-coracao', nome: 'Tapete de coração', slot: 'tapete', preco: 6 },
  { id: 'janela-redonda', nome: 'Janela redonda', slot: 'janela', preco: 8 },
  { id: 'cortina-lilas', nome: 'Janela com cortina lilás', slot: 'janela', preco: 7 },
  { id: 'areia-casinha', nome: 'Casinha de areia', slot: 'areia', preco: 10 },
]);

// Roupinhas e acessórios. A lista da Bianca ainda não chegou — estes são provisórios.
export const ROUPAS = escalonar([
  { id: 'laco-rosa', nome: 'Laço rosa', slot: 'cabeca', preco: 3 },
  { id: 'coleira-sino', nome: 'Coleira com sininho', slot: 'pescoco', preco: 3 },
  { id: 'oculos-redondo', nome: 'Óculos redondos', slot: 'rosto', preco: 4 },
  { id: 'chapeu-palha', nome: 'Chapéu de palha', slot: 'cabeca', preco: 5 },
  { id: 'lenco-azul', nome: 'Lencinho azul', slot: 'pescoco', preco: 4 },
  { id: 'gorro', nome: 'Gorro de dormir', slot: 'cabeca', preco: 5 },
  { id: 'sueter', nome: 'Suéter listrado', slot: 'corpo', preco: 6 },
  { id: 'fone', nome: 'Fone de ouvido', slot: 'cabeca', preco: 6 },
  { id: 'gravata', nome: 'Gravata borboleta', slot: 'pescoco', preco: 4 },
  { id: 'coroa-flores', nome: 'Coroa de flores', slot: 'cabeca', preco: 6 },
  { id: 'oculos-coracao', nome: 'Óculos de coração', slot: 'rosto', preco: 5 },
  { id: 'chapeu-chef', nome: 'Chapéu de chef', slot: 'cabeca', preco: 6 },
]);

// O "quarto básico" da Bianca: vem de graça ao adotar.
export const INICIAIS = [
  { id: 'parede-creme', nome: 'Creme (quarto básico)', slot: 'parede', base: '#fbf0df', padrao: 'liso', preco: 0, nivel: 1 },
  { id: 'janela-simples', nome: 'Janela simples', slot: 'janela', preco: 0, nivel: 1 },
  { id: 'prateleira-simples', nome: 'Prateleira', slot: 'prateleira', preco: 0, nivel: 1 },
  { id: 'areia-basica', nome: 'Caixa de areia', slot: 'areia', preco: 0, nivel: 1 },
];

// Slots que podem ficar vazios (tocar em "Usando" tira o item). Os outros sempre têm algo.
export const OPCIONAIS = new Set(['cama', 'estante', 'tapete', 'abajur', 'quadro', 'planta', 'lustre', 'cabeca', 'rosto', 'pescoco', 'corpo']);

const TODOS = [...INICIAIS, ...COMIDAS, ...PAREDES, ...MOVEIS, ...ROUPAS];
const INDICE = new Map(TODOS.map(i => [i.id, i]));
export const porId = id => INDICE.get(id);
export const liberadosNoNivel = n => [...COMIDAS, ...PAREDES, ...MOVEIS, ...ROUPAS].filter(i => i.nivel === n);
