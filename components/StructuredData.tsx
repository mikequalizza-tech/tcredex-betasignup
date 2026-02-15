export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "tCredex",
    alternateName: "tCredex.com",
    url: "https://beta.tcredex.com",
    logo: "https://beta.tcredex.com/brand/logo-tcredex-cropped.png",
    description: "AI-powered tax credit marketplace for NMTC, LIHTC, HTC, Opportunity Zone, and Brownfield credits. Connecting community development projects with capital.",
    foundingDate: "2023",
    founder: {
      "@type": "Organization",
      name: "American Impact Ventures LLC",
    },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    knowsAbout: [
      "New Markets Tax Credits (NMTC)",
      "Low-Income Housing Tax Credits (LIHTC)",
      "Historic Tax Credits (HTC)",
      "Opportunity Zones",
      "Brownfield Tax Credits",
      "Community Development Entities (CDE)",
      "Community Development Financial Institutions (CDFI)",
      "Qualified Active Low-Income Community Business (QALICB)",
      "Census Tract Eligibility",
      "Tax Credit Financing",
      "Community Development Finance",
    ],
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "tCredex",
    alternateName: "tCredex Tax Credit Marketplace",
    url: "https://beta.tcredex.com",
    description: "AI-powered 5-tax credit marketplace including NMTC, LIHTC, HTC, Opportunity Zone, and Brownfield credits.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://beta.tcredex.com/blog?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "tCredex",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: "AI-powered marketplace that connects tax credit projects with CDEs and investors. Covers NMTC, LIHTC, HTC, Opportunity Zone, and Brownfield programs. Features include census tract eligibility mapping, automated CDE matching, and deal pipeline management.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free beta access",
    },
    featureList: [
      "Census tract eligibility lookup for 85,000+ tracts",
      "AI-powered CDE-to-deal matching (AutoMatch)",
      "NMTC, LIHTC, HTC, OZ, and Brownfield program support",
      "Interactive map with tax credit overlay",
      "Deal intake and pipeline management",
      "Closing room collaboration",
      "ChatTC AI assistant for tax credit questions",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({ items }: { items: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleSchema({
  title,
  description,
  url,
  image,
  publishedAt,
  author,
  category,
}: {
  title: string;
  description?: string;
  url: string;
  image?: string;
  publishedAt?: string;
  author?: string;
  category?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description || title,
    url,
    image: image || "https://beta.tcredex.com/brand/logo-tcredex-cropped.png",
    datePublished: publishedAt || new Date().toISOString(),
    dateModified: publishedAt || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: author || "tCredex Team",
    },
    publisher: {
      "@type": "Organization",
      name: "tCredex",
      logo: {
        "@type": "ImageObject",
        url: "https://beta.tcredex.com/brand/logo-tcredex-cropped.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(category && { articleSection: category }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
