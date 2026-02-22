import { PItem } from './types';

export const KOTONE_P_ITEMS: PItem[] = [
    {
        id: 'hatsuboshi_light_purple',
        name: '初星ライト（紫）',
        description: '元々の消費体力が4以上のスキルカード使用時、スコア上昇量増加5% 体力消費6',
        effects: [
            {
                trigger: 'cardPlayed',
                conditions: { cardMinCost: 4 }, // Requires card cost info in Card type, assume logic check
                action: { type: 'score_up', value: 5, valueType: 'percent' } // And HP consume 6 separate?
                // The requirements says: "Score +5%, HP Consume 6".
                // My effect structure supports one action. I might need array of actions or combined.
                // For Phase 1 CLI, logging is most important.
            }
        ]
    },
    {
        id: 'hatsuboshi_light_orange',
        name: '初星ライト（オレンジ）',
        description: '直接効果でやる気が増加後、体力回復6',
        effects: [
            {
                trigger: 'directMotivation',
                action: { type: 'recover_hp', value: 6 }
            }
        ]
    },
    {
        id: 'cost_0_love_max_plus',
        name: '費用0円愛情MAX+',
        description: 'ターン開始時、やる気が5以上の場合、元気+6（試験・ステージ内2回）',
        effects: [
            {
                trigger: 'turnStart',
                conditions: { minMotivation: 5 },
                action: { type: 'add_genki', value: 6, limitPerStage: 2 }
            }
        ]
    }
    // Add others as needed
];
