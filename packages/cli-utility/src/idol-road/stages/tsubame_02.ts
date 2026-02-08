import { IdolRoadStage } from '../types';

export default {
    idolId: "tsubame",
    stageId: "02",
    plan: "logic",
    pItemIds: ["357", "358", "82", "79"], // Fusawashii+, Good Sleep, Tenkawa Ramen, Dream Luggage
    cardCustomizations: {
        "129": { "36": 1, "56": 1 }, // Wakuwaku+ (Start Hand, Mot+1)
        "133": { "56": 2 }, // Hinata Bokko+ (Mot+4)
    },
    params: {
        vocal: 1457,
        dance: 2702,
        visual: 603
    },
    engineConfig: {
        fixedDeck: [
            "129", "253", "21", "171", // T1
            "157", "133", "633", "652", // T2
            "135", "626", "296", // T3
            "307", "174", "22"   // T4+
        ],
        maxTurns: 8,
        stamina: 51,
        turnTypes: ['dance', 'visual', 'vocal', 'dance', 'dance', 'visual', 'vocal', 'dance', 'dance']
    },
    gimmicks: [
        {
            condition: "turnsElapsed==7",
            action: "turnsRemaining=0",
            trigger: "turnEnd",
            description: "8ターン終了時ゲームオーバー"
        },
        {
            condition: "turnsElapsed==0",
            action: "motivation+=3",
            trigger: "turnStart",
            description: "1ターン目: やる気+3"
        },
        {
            condition: "turnsElapsed==2 && motivation>=6 && isVocalTurn",
            action: "genki+=20",
            trigger: "turnStart",
            description: "3ターン目: やる気が6以上の場合、元気+20 (+やる気)"
        },

        {
            condition: "turnsElapsed==4 && motivation<=10",
            action: "slumpTurns+=1",
            trigger: "turnStart",
            description: "5ターン目: やる気が10以下の場合、スランプ1ターン"
        },
        {
            condition: "turnsElapsed==6 && motivation>=15",
            action: "genki*=1.5",
            trigger: "turnStart",
            description: "7ターン目: やる気が15以上の場合、元気1.5倍"
        }
    ]
};
