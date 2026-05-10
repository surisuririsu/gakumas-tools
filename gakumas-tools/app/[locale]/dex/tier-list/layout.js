import DexCategoryLayout from "@/components/DexCategoryLayout";

const TABS = ["skill-cards", "p-items", "p-drinks", "p-idols"];

export default function TierListLayout({ children }) {
  return (
    <DexCategoryLayout basePath="/dex/tier-list" tabs={TABS} wide flexible>
      {children}
    </DexCategoryLayout>
  );
}
