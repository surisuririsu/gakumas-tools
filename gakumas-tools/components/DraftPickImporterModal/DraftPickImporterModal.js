"use client";
import ScreenshotImporterModal from "@/components/ScreenshotImporterModal";
import { getDraftPickFromFile } from "@/utils/imageProcessing/draftPick";

function DraftPickImporterModal({ onSuccess }) {
  return (
    <ScreenshotImporterModal
      translationNamespace="DraftPickImporterModal"
      importFn={getDraftPickFromFile}
      onSuccess={onSuccess}
    />
  );
}

export default DraftPickImporterModal;
