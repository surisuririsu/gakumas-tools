declare module 'gakumas-engine' {
    export class StageEngine {
        constructor(config: any, linkConfigs?: any[]);
        cardManager: any;
        executor: any;
        getInitialState(skipEffects?: boolean): any;
        startStage(state: any): any;
        useCard(state: any, card: any): any;
        endTurn(state: any): any;
        changeIdol(state: any): any;
    }

    export class Executor {
        constructor(engine: any);
        engine: any;
        executeAction(state: any, action: any, card?: any): void;
        resolveGenki(state: any, genki: number): void;
    }
}

declare module 'gakumas-engine/engine/Executor.js' {
    import { Executor } from 'gakumas-engine';
    export default Executor;
}

declare module 'gakumas-engine/constants' {
    export const S: Record<string, number>;
    export const LOGGED_FIELDS: number[];
    export const TOKEN_REGEX: RegExp;
    export function formatEffect(effect: any): any;
    export function formatDiffField(val: any): string;
}

declare module 'gakumas-data' {
    export const SkillCards: {
        getById(id: string | number): any;
        getAll(): any[];
        data: any[];
    };
    export const PItems: {
        getById(id: string | number): any;
    };
}

declare module 'gakumas-data/json/p_items.json' {
    const value: any;
    export default value;
}
