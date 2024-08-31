import Simulator from "@/components/Simulator";

export async function generateMetadata({ searchParams }) {
  const query = new URLSearchParams(searchParams).toString();

  return {
    title: "Gakumas Tools - シミュレーター",
    openGraph: {
      images: [`/api/preview/?${query}`],
    },
  };
}

export default function SimulatorPage() {
  return <Simulator />;
}
