import { S } from "../constants";

export function shuffle(arr) {
  let currentIndex = arr.length;

  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }

  return arr;
}

export function formatDiffField(value) {
  if (isNaN(value)) return value;
  return parseFloat(value.toFixed(2));
}

export function shallowCopy(state) {
  return { ...state };
}

export function deepCopy(state) {
  return JSON.parse(JSON.stringify(state));
}
