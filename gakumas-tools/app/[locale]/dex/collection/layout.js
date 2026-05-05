import DexCategoryLayout from "@/components/DexCategoryLayout";

const TABS = ["p-idols"];

export default function CollectionLayout({ children }) {
  return (
    <DexCategoryLayout basePath="/dex/collection" tabs={TABS} wide>
      {children}
    </DexCategoryLayout>
  );
}
