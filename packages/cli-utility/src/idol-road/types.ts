export interface Card {
    id: string; // The numeric ID from JSON as string, or unique instance ID
    originalId?: number; // The numeric ID from master data
    name: string;
    rarity: 'N' | 'R' | 'SR' | 'SSR';
    consumption: boolean;
    type?: string; // active, mental, etc.
}

export interface PItem {
    id: string;
    name: string;
    description: string;
    effects: PItemEffect[];
}

export interface PItemEffect {
    trigger: 'turnStart' | 'turnEnd' | 'cardPlayed' | 'directMotivation';
    conditions?: {
        minMotivation?: number;
        cardRarity?: string;
        cardMinCost?: number;
        turnType?: 'vocal' | 'dance' | 'visual';
        minTurn?: number;
        maxTurn?: number;
    };
    action: {
        type: 'score_up' | 'recover_hp' | 'add_good_impression' | 'add_motivation' | 'add_genki' | 'add_card_use' | 'add_buff' | 'custom';
        value: number; // For score_up, this might be percentage or fixed
        valueType?: 'fixed' | 'percent' | 'percent_of_motivation' | 'percent_of_exhausted_hp';
        limitPerStage?: number; // e.g. 1 time per stage
    };
}

export interface StageGimmick {
    condition: string;
    action: string;
    trigger?: 'turnStart' | 'turnEnd'; // Defaults to turnStart if undefined?
    description?: string;
}

export interface IdolRoadStage {
    idolId: string;
    stageId: string; // e.g., "01"
    plan: 'logic' | 'sense' | 'anomaly';
    params?: {
        vocal: number;
        dance: number;
        visual: number;
    };
    pItemIds?: (string | number)[];
    cardCustomizations?: Record<string, Record<string, number>>;
    engineConfig: {
        maxTurns: number;
        stamina?: number;
        fixedDeck?: string[];
        fixedDraws?: Record<string, number[]>; // Turn number (1-based) -> Array of Card IDs
        turnTypes?: ('vocal' | 'dance' | 'visual')[]; // Optional for now
    };
    gimmicks: StageGimmick[];
}
