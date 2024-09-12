import { unstable_setRequestLocale } from "next-intl/server";
import Simulator from "@/components/Simulator";

export default function SimulatorPage({ params: { locale } }) {
  unstable_setRequestLocale(locale);
  return (
    <>
      AI UPDATE PREVIEW
      <Simulator defaultStrategy="v2-pre1" />
    </>
  );
}
