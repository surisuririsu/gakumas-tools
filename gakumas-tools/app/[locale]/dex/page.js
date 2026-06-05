import { setRequestLocale, getTranslations } from "next-intl/server";
import { FaBook, FaListCheck, FaTableList } from "react-icons/fa6";
import { Link } from "@/i18n/routing";
import { generateMetadataForTool } from "@/utils/metadata";
import styles from "./page.module.scss";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("dex", locale, "/dex");
}

const CATEGORIES = [
  {
    key: "reference",
    href: "/dex/reference/skill-cards",
    icon: <FaBook />,
  },
  {
    key: "collection",
    href: "/dex/collection/p-idols",
    icon: <FaListCheck />,
  },
  {
    key: "tierlist",
    href: "/dex/tier-list/skill-cards",
    icon: <FaTableList />,
  },
];

export default async function DexHubPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dex" });

  return (
    <ul className={styles.hub}>
      {CATEGORIES.map(({ key, href, icon }) => (
        <li key={key}>
          <Link href={href} className={styles.card}>
            <span className={styles.icon}>{icon}</span>
            <div className={styles.text}>
              <span className={styles.title}>
                {t(`categories.${key}.title`)}
              </span>
              <span className={styles.description}>
                {t(`categories.${key}.description`)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
