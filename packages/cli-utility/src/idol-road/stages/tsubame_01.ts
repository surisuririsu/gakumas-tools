import { IdolRoadStage } from '../types';

export default {
    idolId: "tsubame",
    stageId: "01",
    plan: "logic",
    engineConfig: {
        maxTurns: 12,
    },
    gimmicks: [
        {
            condition: "turnsElapsed==11",
            action: "game_over",
            trigger: "turnEnd", // Logic turn 12 end
            description: "12ターン終了時ゲームオーバー"
        },
        {
            condition: "turnsElapsed==0",
            action: "motivation+=3",
            trigger: "turnStart",
            description: "1ターン目にやる気+3"
        },
        {
            condition: "turnsElapsed==4",
            action: "goodImpressionTurns+=1",
            trigger: "turnStart",
            description: "5ターン目に好印象+1"
        },
        {
            condition: "turnsElapsed==9",
            action: "goodImpressionTurns+=1",
            trigger: "turnStart",
            description: "10ターン目に好印象+1"
        },
        {
            condition: "turnsElapsed>=3 && motivation>=5",
            action: "motivation+=2",
            trigger: "turnEnd",
            description: "Cheer: Mot+2 (Turn 4+, End of Turn)"
        },
        {
            condition: "turnsElapsed>=8 && genki>=75",
            action: "score+=genki",
            trigger: "turnEnd",
            description: "Cheer: Score+=Genki (Turn 9+, End of Turn)"
        },
        {
            condition: "turnsElapsed==6 && motivation<=17",
            action: "uneaseTurns+=3",
            trigger: "turnStart",
            description: "Trouble: Unease if Mot<=17 (Turn 7 Start)"
        },
        {
            condition: "turnsElapsed==5 && motivation>=8",
            action: "stamina+=6",
            trigger: "turnStart",
            description: "Stage Effect: Stamina+6 if Mot>=8 (Turn 6 Start)"
        },
        {
            condition: "turnCount==9 && motivation>=16",
            action: "scoreBuff+=1.0",
            trigger: "turnStart",
            description: "Stage Effect: Score Up 100% if Mot>=16 (Turn 9 Start)"
        }
    ]
};
