# CLAUDE.md — PomodoroCat

Responda sempre em **português**. Este repositório é só o app. O resto da vida do Kevin fica no vault
e **não se discute aqui**.

## Fonte de verdade das decisões
`C:\Users\kevin\SegundoCerebroPessoal\01 Projetos\PomodoroCat - app de pomodoro da Bianca.md`

As regras do jogo são da **Bianca** (noiva do Kevin; o app é dela). Antes de mudar regra, preço,
economia ou a linha do tempo da saúde do gato, leia a nota — e mudança de regra é decisão dela,
não nossa. Os números ficam todos em `regras.js`, marcados com `(Bianca)` quando são dela.

## O que é
Pomodoro com bichinho virtual, estilo Usagi Shima / Bob Goods: um gatinho num quarto em tons
pastéis. Cada pomodoro de 25 min vale 1 moeda; moeda compra comida (o gato reage conforme o
preço), roupinhas e móveis. Sem pomodoro ele chora, adoece e, em 15 dias, vira estrelinha.

Publicado em https://kevindustries-tech.github.io/pomodorocat/ — a Bianca usa o app instalado de lá.

**Sem build e sem bundler**: HTML + ES modules + Canvas 2D. Nenhuma imagem: o gato, o quarto e
os móveis são desenhados em código, então cor, pelagem, pelo e roupinha são só parâmetros.

## Arquivos
| Arquivo | Papel |
|---|---|
| `index.html` | Interface inteira: CSS e markup inline, ícones SVG |
| `regras.js` | Todos os números do jogo |
| `catalogo.js` | Comidas, paredes, móveis e roupinhas. **A ordem da lista é a ordem de liberação** |
| `estado.js` | Estado e ações (alimentar, comprar, tratar, timer). Não desenha nada |
| `gato.js` | O gatinho: pelagens, pelo curto/médio/longo, rosto, roupinhas, poses |
| `quarto.js` | O quarto de frente e cada móvel no seu slot; miniaturas da loja |
| `cena.js` | Junta quarto + gato + partículas + balão; animações das reações |
| `som.js` | Musiquinha e sons gerados com Web Audio (sem arquivo de áudio) |
| `app.js` | Cola: adoção, cartão do timer, folhas, cliques |
| `galeria.html` | Página de conferência com todas as poses, pelagens, roupinhas e móveis |
| `icone.html` | Desenha o ícone; os PNG saem por print do Edge headless |
| `sw.js` | Service worker (offline, rede primeiro). Só registra em https |
| `server.py` | Servidor de dev sem cache (porta 8091) |

Dados em `localStorage['pomodorocat.v1']`.

## Regras de trabalho
- **Não introduzir bundler, npm, TypeScript ou framework.** Edita, salva, recarrega.
- O timer guarda o **horário de término**, nunca conta tique-taque: com a tela apagada o celular
  congela a página, e a conta precisa continuar certa quando ela volta.
- Nenhum celular garante alarme de PWA com a tela apagada. Por isso a tela fica acesa no foco
  (Wake Lock). Alarme em segundo plano de verdade só empacotando como app (Capacitor, fase 3).
- **Mexeu em arquivo da lista `APP` do `sw.js`? Suba o `CACHE`.**
- `?teste=1` na URL: foco de 20 s, pausa de 8 s e um painel para pular dias, ganhar moeda/XP,
  dar fome e sujar a areia. Use para conferir a linha do tempo da saúde sem esperar semanas.
- Servidor: `preview_start {name: "pomodorocat"}` (configurado no `.claude/launch.json` do vault).
- Mudou desenho? Abra `galeria.html` — mostra tudo de uma vez. Para ver nítido:
  `msedge --headless=new --screenshot=saida.png --window-size=1100,2300 http://localhost:8091/galeria.html`

## Ícones
Mudou o gato? Regenere os PNG (servidor ligado):
```
for t in 512 192 180; do msedge --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=$t,$t --virtual-time-budget=3000 --screenshot=icon-$t.png "http://localhost:8091/icone.html?t=$t"; done
```

## Fim de cada bloco de trabalho
Dois repositórios, os dois com commit e push:
1. `Documents\PomodoroCat` → `kevindustries-tech/pomodorocat`.
2. `SegundoCerebroPessoal` → Log e estado atual na nota do projeto.

## Jeito de responder
Direto, passo a passo numerado quando for procedimento. Deu errado: diagnóstico + correção.
Discordar com motivo técnico é bem-vindo.
