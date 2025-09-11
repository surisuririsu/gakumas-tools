"use client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Simulator from "./Simulator";

export default function SimulatorWithDnd() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Simulator />
    </DndProvider>
  );
}
