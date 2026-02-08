
import { IdolRoadStage } from '../types';

export default {
    idolId: "tsubame",
    stageId: "03",
    plan: "logic",
    params: { vocal: 1512, dance: 1512, visual: 1512 },
    pItemIds: ["357", "358", "82", "79"], // Same as Stage 02
    cardCustomizations: {
        "129": { "36": 1, "56": 1 }, // Wakuwaku+ (Start Hand, Mot+1)
        "133": { "56": 2 }, // Hinata Bokko+ (Mot+4)
    },
    engineConfig: {
        fixedDeck: [
            "129", "253", "21", "171", // T1
            "157", "133", "633", "652", // T2
            "135", "626", "296", // T3
            "307", "174", "22"   // T4+
        ],
        maxTurns: 20,
        stamina: 51, // Estimated from stage 02
        turnTypes: [
            'dance', 'dance', 'visual', 'vocal', 'dance',
            'dance', 'dance', 'dance', 'visual', 'dance',
            'dance', 'vocal', 'visual', 'vocal', 'vocal',
            'vocal', 'dance', 'visual', 'vocal', 'dance'
        ]
    },
    gimmicks: [
        {
            condition: "turnsElapsed==0",
            action: "motivation+=3",
            trigger: "turnStart",
            description: "1ターン目: やる気+3"
        },
        {
            condition: "turnsElapsed==2 && motivation<=5",
            action: "weakness+=2",
            trigger: "turnStart",
            description: "3ターン目: やる気が5以下の場合、弱気2"
        },
        {
            condition: "turnsElapsed==5 && genki<=24",
            action: "stamina-=10",
            trigger: "turnStart",
            description: "6ターン目: 元気が24以下の場合、体力消費10"
        },
        {
            condition: "turnsElapsed==8 && motivation<=15",
            action: "stamina-=10",
            trigger: "turnStart",
            description: "9ターン目: やる気が15以下の場合、体力消費10"
        }
    ]
} as IdolRoadStage;
