import { PItem } from './types';

export const TSUBAME_P_ITEMS: PItem[] = [
    {
        id: 'tsubame_item_1',
        name: 'ふさわしい、私+',
        description: 'Tsubame P-Item 1',
        effects: [{
            trigger: 'cardPlayed', // Inferring from log
            conditions: {
            },
            action: {
                type: 'custom',
                value: 0,
            }
        }]
    },
    {
        id: 'tsubame_item_2',
        name: '天川ラーメン巡り',
        description: 'Tsubame P-Item 2',
        effects: [{
            trigger: 'turnStart',
            conditions: {
                minTurn: 2, // Log: Turn 2 start
                maxTurn: 2  // Only Turn 2?
            },
            action: {
                type: 'add_card_use',
                value: 1
            }
        }]
    },
    {
        id: 'tsubame_item_3',
        name: '寝心地は良好',
        description: 'Tsubame P-Item 3',
        effects: [{
            trigger: 'cardPlayed',
            conditions: {
            },
            action: {
                type: 'add_buff',
                value: 0 // Buff: "Increase Up"
            }
        }]
    },
    {
        id: 'tsubame_item_4',
        name: '夢にあふれた大荷物',
        description: 'Tsubame P-Item 4',
        effects: [{
            trigger: 'turnStart',
            conditions: {
                minTurn: 1,
                maxTurn: 1
            },
            action: {
                type: 'add_card_use',
                value: 1
            }
        }]
    }
];
