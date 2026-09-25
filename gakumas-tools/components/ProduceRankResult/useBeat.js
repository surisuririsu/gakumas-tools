import { useState } from "react";

export default function useBeat(value) {
  const [last, setLast] = useState(value);
  const [beat, setBeat] = useState(0);
  if (value !== last) {
    setLast(value);
    setBeat(beat == 1 ? 2 : 1);
  }
  return beat;
}
