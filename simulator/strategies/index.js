import DeepAverageScoreStrategy, {
  MAX_DEPTH as DAS_MAX_DEPTH,
} from "./DeepAverageScoreStrategy";
import DeepMaxScoreStrategy, {
  MAX_DEPTH as DMS_MAX_DEPTH,
} from "./DeepMaxScoreStrategy";
import DeepRandomScoreStrategy, {
  MAX_DEPTH as DRS_MAX_DEPTH,
} from "./DeepRandomScoreStrategy";
import DeepShallowScoreStrategy, {
  MAX_DEPTH as DSS_MAX_DEPTH,
} from "./DeepShallowScoreStrategy";
import HeuristicStrategy from "./HeuristicStrategy";
import RandomStrategy from "./RandomStrategy";

const STRATEGIES = {
  HeuristicStrategy,
  [`DeepShallowScoreStrategy (depth=${DSS_MAX_DEPTH})`]:
    DeepShallowScoreStrategy,
  [`DeepMaxScoreStrategy (depth=${DMS_MAX_DEPTH})`]: DeepMaxScoreStrategy,
  [`DeepRandomScoreStrategy (depth=${DRS_MAX_DEPTH})`]: DeepRandomScoreStrategy,
  [`DeepAverageScoreStrategy (depth=${DAS_MAX_DEPTH})`]:
    DeepAverageScoreStrategy,
  RandomStrategy,
};

export default STRATEGIES;
