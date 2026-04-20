import * as ort from "onnxruntime-web";

function loadModel(modelPath, classesPath) {
  let promise;
  return () => {
    if (!promise) {
      promise = Promise.all([
        ort.InferenceSession.create(modelPath),
        fetch(classesPath).then((r) => r.json()),
      ]).then(([session, classes]) => ({ session, classes }));
    }
    return promise;
  };
}

export const loadSkillCardModel = loadModel(
  "/skill_card_model.onnx",
  "/skill_card_classes.json",
);

export const loadPItemModel = loadModel(
  "/p_item_model.onnx",
  "/p_item_classes.json",
);
