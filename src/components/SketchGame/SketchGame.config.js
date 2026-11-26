import { loadModel } from 'utils';

const labels = require("../../labels.json");

export const SketchGameConfig = {
  config: {
    noRounds: labels.length, // uma rodada por categoria (antes era fixo em 10)
    timeLimit: 20, // seconds

    model: loadModel('./assets/models/model.json'),
    labels,
    randomiseLabels: true,

    msgs: {
      intro: "Vamos começar.",
      question: "Você tem <span id=\"timeLeft\">{{timeLeft}}</span> segundos para desenhar <span class=\"text-accent\">{{label}}</span>",
      questionSuffix: " no quadro!", // só na primeira rodada
      pointScore: [
        "Nada mal!",
        "Belo rabisco!",
        "Você manda bem!",
        "Desenhar é o seu forte!",
        "Muito artístico!",
        "É você, Picasso..?"
      ],
      pointLose: [
        "Será que precisa de umas aulas de desenho...?!",
        "Não esqueça de usar os óculos...!",
        "Você consegue fazer melhor...!",
        "Hmmm!",
        "Não largue o emprego ainda.",
        "Nenhuma IA entenderia isso ;)"
      ],
      win:  {
        low: "Bom esforço! Dá para melhorar a pontuação. Tente de novo!",
        high: "Muito bem! Já pensou em vender suas obras de arte?",
        perfect: "Maestro! Você venceu! Acertou todas :)",
        sound: "game_win"
      },
      lose: {
        low: "Ops... Tente com mais vontade da próxima vez! Talvez você consiga passar de {{score}}!",
        high: "Quase lá, mas não foi dessa vez!",
        sound: "game_lose"
      },
      pause: "^150 "
    }
  }
};
