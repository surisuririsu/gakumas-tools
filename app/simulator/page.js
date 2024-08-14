import Simulator from "@/components/Simulator";

export async function generateMetadata({ searchParams }) {
  const query = new URLSearchParams(searchParams).toString();

  return {
    title: "Gakumas Tools - Simulator",
    description: "Plan and simulate Gakumas contest loadouts",
    openGraph: {
      images: [`/api/preview/?${query}`],
    },
  };
}

export default function SimulatorPage() {
  return <Simulator />;
}
