import { getLocale, getMessages } from "next-intl/server";
import Table from "@/components/Table";
import { localePath } from "@/utils/localeUrls";
import styles from "./CalculatorGuide.module.scss";

export default async function CalculatorGuide({ tool, path, ranks }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const common = messages.CalculatorGuide;
  const guide = common?.[tool];
  if (!guide) return null;

  const toolMessages = messages.tools?.[tool] ?? {};
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: toolMessages.metaTitle ?? toolMessages.title,
      description: toolMessages.metaDescription ?? toolMessages.description,
      url: localePath(locale, path, { absolute: true }),
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      inLanguage: locale,
    },
  ];
  if (guide.faq?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });
  }

  return (
    <section className={styles.guide}>
      <h1 className={styles.title}>{guide.h1}</h1>
      <p className={styles.about}>{guide.intro}</p>

      <details>
        <summary>{common.howToTitle}</summary>
        <p>{guide.howToBody}</p>
      </details>

      {ranks && (
        <details>
          <summary>{common.ranksTitle}</summary>
          <Table
            headers={[common.rankHeader, common.ratingHeader]}
            rows={ranks.map(([rank, rating]) => [
              rank,
              rating.toLocaleString(),
            ])}
          />
        </details>
      )}

      <details>
        <summary>{common.formulaTitle}</summary>
        <p>{guide.formulaBody}</p>
      </details>

      {guide.faq?.length > 0 && (
        <details>
          <summary>{common.faqTitle}</summary>
          {guide.faq.map(({ q, a }) => (
            <div key={q} className={styles.faqItem}>
              <p className={styles.question}>{q}</p>
              <p>{a}</p>
            </div>
          ))}
        </details>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
