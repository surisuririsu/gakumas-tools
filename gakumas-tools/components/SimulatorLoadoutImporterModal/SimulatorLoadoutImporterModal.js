"use client";
import ScreenshotImporterModal from "@/components/ScreenshotImporterModal";
import { getSimulatorLoadoutFromFile } from "@/utils/imageProcessing/simulatorLoadout";

function SimulatorLoadoutImporterModal({ onSuccess }) {
  return (
    <ScreenshotImporterModal
      translationNamespace="SimulatorLoadoutImporterModal"
      importFn={getSimulatorLoadoutFromFile}
      onSuccess={onSuccess}
    />
  );
}

export default SimulatorLoadoutImporterModal;
