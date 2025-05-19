export function serializeEffect(effect) {
  const exp = [];
  if (effect.phase) exp.push(`at:${effect.phase}`);
  if (effect.conditions) {
    effect.conditions.forEach((condition) => {
      exp.push(`if:${condition.join("")}`);
    });
  }
  if (effect.actions) {
    effect.actions.forEach((action) => {
      exp.push(`do:${action.join("")}`);
    });
  }
  if (effect.group) {
    exp.push(`group:${effect.group}`);
  }
  if (effect.limit) {
    exp.push(`limit:${effect.limit}`);
  }
  if (effect.ttl) {
    exp.push(`ttl:${effect.ttl}`);
  }
  if (effect.targets) {
    effect.targets.forEach((target) => {
      exp.push(`target:${target}`);
    });
  }
  if (effect.delay) {
    exp.push(`delay:${effect.delay}`);
  }
  return exp.join(",");
}

const TOKEN_REGEX = /([=!]?=|[<>]=?|[+\-*/%]=?|&)/;

export function deserializeEffect(effectString) {
  if (!effectString.length) return {};
  return effectString.split(/,(?![^()]*\))/).reduce((acc, cur) => {
    const [expKey, expValue] = cur.split(":");
    if (expKey == "at") {
      acc.phase = expValue;
    } else if (expKey == "if") {
      if (!acc.conditions) acc.conditions = [];
      acc.conditions.push(expValue.split(TOKEN_REGEX));
    } else if (expKey == "do") {
      if (!acc.actions) acc.actions = [];
      acc.actions.push(expValue.split(TOKEN_REGEX));
    } else if (expKey == "group") {
      acc.group = parseInt(expValue, 10);
    } else if (expKey == "limit") {
      acc.limit = parseInt(expValue, 10);
    } else if (expKey == "ttl") {
      acc.ttl = parseInt(expValue, 10);
    } else if (expKey == "target") {
      if (!acc.targets) acc.targets = [];
      acc.targets.push(expValue);
    } else if (expKey == "level") {
      acc.level = parseInt(expValue, 10);
    } else if (expKey == "line") {
      acc.line = parseInt(expValue, 10);
    } else if (expKey == "delay") {
      acc.delay = parseInt(expValue, 10);
    } else {
      console.warn("Unrecognized effect segment", effectString);
    }
    return acc;
  }, {});
}

export function serializeEffectSequence(effectSequence) {
  return effectSequence.map(serializeEffect).join(";");
}

export function deserializeEffectSequence(effectSequenceString) {
  return effectSequenceString?.length
    ? effectSequenceString.split(";").map(deserializeEffect)
    : [];
}
