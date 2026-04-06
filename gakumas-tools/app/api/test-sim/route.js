// Test simulation endpoint
import { IdolConfig, StageConfig, IdolStageConfig, StageEngine, StagePlayer, STRATEGIES, resetRand } from "gakumas-engine";
import { Customizations, Stages, SkillCards } from "gakumas-data";
import { loadoutFromSearchParams } from "@/utils/simulator";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Debug endpoint to check customization parsing
    if (searchParams.get('debug') === 'c11n') {
      const c11nId = parseInt(searchParams.get('id') || '50');
      const c11n = Customizations.getById(c11nId);
      return Response.json({
        id: c11nId,
        growth: c11n?.growth || null,
      });
    }

    // Debug endpoint to check skill card effects
    if (searchParams.get('debug') === 'card') {
      const cardId = parseInt(searchParams.get('id') || '453');
      const card = SkillCards.getById(cardId);
      return Response.json({
        id: cardId,
        name: card?.name,
        effects: card?.effects,
      });
    }

    // Debug endpoint to check p-item effects
    if (searchParams.get('debug') === 'pitem') {
      const { PItems } = await import("gakumas-data");
      const pitemId = parseInt(searchParams.get('id') || '180');
      const pitem = PItems.getById(pitemId);
      return Response.json({
        id: pitemId,
        name: pitem?.name,
        effects: pitem?.effects,
      });
    }

    // Debug endpoint to trace a specific turn's card execution
    if (searchParams.get('debug') === 'trace') {
      const turnNum = parseInt(searchParams.get('turn') || '73');
      const loadout = loadoutFromSearchParams(searchParams);
      const stage = Stages.getById(loadout.stageId);
      resetRand();
      const idolConfig = new IdolConfig(loadout);
      const stageConfig = new StageConfig(stage);
      const config = new IdolStageConfig(idolConfig, stageConfig, false);
      const engine = new StageEngine(config);
      const strategy = new STRATEGIES.HeuristicStrategy(engine);
      engine.strategy = strategy;

      // Play until the target turn
      let state = engine.getInitialState();
      for (let i = 0; i < turnNum; i++) {
        const result = strategy.evaluate(state);
        state = result.state;
      }

      // Now evaluate each card's predicted score
      const { S } = await import("gakumas-engine/constants");
      const { deepCopy } = await import("gakumas-engine/utils");
      const handCards = state[S.handCards];
      const cardPredictions = [];
      for (const card of handCards) {
        const cardInfo = state[S.cardMap][card];
        if (engine.isCardUsable(state, card)) {
          const previewState = engine.useCard(deepCopy(state), card);
          cardPredictions.push({
            cardId: cardInfo.id,
            score: previewState[S.score],
            stamina: previewState[S.stamina],
            genki: previewState[S.genki],
          });
        } else {
          cardPredictions.push({ cardId: cardInfo.id, usable: false });
        }
      }

      return Response.json({
        turn: turnNum,
        handCards: handCards.map(c => state[S.cardMap][c].id),
        cardPredictions,
      });
    }

    const loadout = loadoutFromSearchParams(searchParams);
    const stage = Stages.getById(loadout.stageId);

    // Reset RNG for deterministic results
    const seedParam = searchParams.get('seed');
    resetRand(seedParam ? parseInt(seedParam, 10) : undefined);

    const idolConfig = new IdolConfig(loadout);
    const stageConfig = new StageConfig(stage);
    const config = new IdolStageConfig(idolConfig, stageConfig, false);

    const engine = new StageEngine(config);
    const strategy = new STRATEGIES.HeuristicStrategy(engine);
    engine.strategy = strategy;

    const result = await new StagePlayer(engine, strategy).play();

    // Debug mode: return full logs
    if (searchParams.get('debug') === 'logs') {
      return Response.json({
        score: result.score,
        turns: result.logs?.length || 0,
        logs: result.logs,
      });
    }

    return Response.json({
      score: result.score,
      turns: result.logs?.length || 0,
    });
  } catch (e) {
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
