import HeuristicStrategy from "./HeuristicStrategy";
import HeuristicStrategy2 from "./HeuristicStrategy2";
import RandomStrategy from "./RandomStrategy";

const STRATEGIES = {
  v1: HeuristicStrategy,
  "v2-pre1": HeuristicStrategy2,
  random: RandomStrategy,
};

export default STRATEGIES;
