import DexCategoryLayout from "@/components/DexCategoryLayout";

const TABS = ["skill-cards", "p-items", "p-drinks"];

export default function ReferenceLayout({ children }) {
  return (
    <DexCategoryLayout basePath="/dex/reference" tabs={TABS}>
      {children}
    </DexCategoryLayout>
  );
}
