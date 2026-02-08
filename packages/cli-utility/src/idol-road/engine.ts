import { Card } from './types';
import { StageGimmickObserver } from './gimmick';

export class IdolRoadEngine {
    public deck: Card[];
    public hand: Card[] = [];
    public discard: Card[] = [];
    public exhaust: Card[] = [];

    public turnsElapsed: number = 0; // Renamed from turnCount to match gakumas-engine
    private gimmickObserver: StageGimmickObserver;

    constructor(initialDeck: Card[], maxTurns: number = 18, turnTypes: ('vocal' | 'dance' | 'visual')[] = []) {
        this.deck = [...initialDeck];
        this.maxTurns = maxTurns;
        this.turnTypes = turnTypes;
        this.gimmickObserver = new StageGimmickObserver(this);
        this.shuffleDeck();
    }

    public maxTurns: number;
    private pItems: any[] = []; // Using any for now to avoid circular dependency issues if types are in another file, but ideally PItem[]

    // State
    public motivation = 0;
    public goodImpressionTurns = 0;
    public genki = 0;
    public nullifyDebuff = 0; // Stack count
    public stamina = 100;
    public slumpTurns = 0;
    public cardUses = 0; // Usage count bonus (Base is usually 1)
    public turnTypes: ('vocal' | 'dance' | 'visual')[] = [];

    get currentTurnType(): 'vocal' | 'dance' | 'visual' | undefined {
        return this.turnTypes[this.turnsElapsed];
    }

    public setPItems(items: any[]) {
        this.pItems = items;
    }

    public setStamina(stamina: number) {
        this.stamina = stamina;
    }

    private shuffleDeck(): void {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    public draw(count: number): void {
        console.log(`\n[Action] Draw ${count} cards.`);
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                console.log("[Engine] Deck empty. Reshuffling discard pile...");
                if (this.discard.length === 0) {
                    console.log("[Engine] Discard is also empty. Cannot draw.");
                    break;
                }
                this.deck = [...this.discard];
                this.discard = [];
                this.shuffleDeck();
            }

            const card = this.deck.shift();
            if (card) {
                this.hand.push(card);
            }
        }
    }

    public playCard(handIndex: number): void {
        if (handIndex < 0 || handIndex >= this.hand.length) {
            console.log("[Error] Invalid hand index.");
            return;
        }

        const card = this.hand.splice(handIndex, 1)[0];
        console.log(`[Action] Create/Play: ${card.name} (Consumption: ${card.consumption})`);

        this.gimmickObserver.onCardPlayed(card);

        if (card.consumption) {
            console.log(`[Engine] ${card.name} is Consumable -> Exhaust`);
            this.exhaust.push(card);
        } else {
            console.log(`[Engine] ${card.name} -> Discard`);
            this.discard.push(card);
        }
    }

    public endTurn(): void {
        console.log("\n[Action] End Turn. Discarding hand.");
        while (this.hand.length > 0) {
            const card = this.hand.pop();
            if (card) this.discard.push(card);
        }
        this.turnsElapsed++;
    }

    // Gimmick Support Methods
    public getExhaust(): Card[] {
        return this.exhaust;
    }

    public recoverFromExhaust(index: number): void {
        if (index < 0 || index >= this.exhaust.length) return;
        const card = this.exhaust.splice(index, 1)[0];
        this.deck.push(card); // Add to bottom
    }

    public recoverAllExhaustedToBottom(rarity: string): number {
        const cardsToRecover = this.exhaust.filter(c => c.rarity === rarity);
        const count = cardsToRecover.length;

        if (count === 0) return 0;

        // Remove from exhaust
        this.exhaust = this.exhaust.filter(c => c.rarity !== rarity);

        // Add to bottom of deck
        this.deck.push(...cardsToRecover);

        return count;
    }

    // Debug / State
    public getHand(): Card[] { return this.hand; }
    public getDeck(): Card[] { return this.deck; }
    public getDiscard(): Card[] { return this.discard; }

    public printState(): void {
        console.log("-".repeat(40));
        console.log(`Turn: ${this.turnsElapsed}`);
        console.log(`Hand (${this.hand.length}): ${this.hand.map(c => c.name).join(', ')}`);
        console.log(`Deck (${this.deck.length}): ${this.deck.map(c => c.name).join(', ')}`);
        console.log(`Discard (${this.discard.length}): ${this.discard.map(c => c.name).join(', ')}`);
        console.log(`Exhaust (${this.exhaust.length}): ${this.exhaust.map(c => c.name).join(', ')}`);
        console.log("-".repeat(40));
    }
}
