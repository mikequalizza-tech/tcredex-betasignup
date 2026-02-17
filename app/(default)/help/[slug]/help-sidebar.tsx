"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface LinkItem {
  name: string;
  href: string;
}

interface LinkSection {
  section: string;
  items: LinkItem[];
}

export default function HelpSidebar() {
  const pathname = usePathname();

  const sections: LinkSection[] = [
    {
      section: "Overview",
      items: [
        { name: "Help Center", href: "/help" },
        { name: "What is tCredex?", href: "/help/what-is-tcredex" },
        { name: "System Overview", href: "/help/system-overview" },
        { name: "Getting Started", href: "/help/get-started" },
      ],
    },
    {
      section: "Account Guides",
      items: [
        { name: "Creating Your Account", href: "/help/create-account" },
        { name: "Sponsor Guide", href: "/help/sponsor-account-guide" },
        { name: "CDE Guide", href: "/help/cde-account-guide" },
        { name: "Investor Guide", href: "/help/investor-account-guide" },
        { name: "Roles & Teams", href: "/help/roles-and-teams" },
      ],
    },
    {
      section: "Features",
      items: [
        { name: "Intake Form Guide", href: "/help/tCredex_Intake_Form" },
        { name: "How AutoMatch Works", href: "/help/automatch-explained" },
        { name: "Closing Room Guide", href: "/help/closing-room-guide" },
        { name: "The Map", href: "/help/map-source-of-truth" },
        { name: "How ChatTC Works", href: "/help/how-chatTC-works" },
      ],
    },
    {
      section: "Plans & Pricing",
      items: [
        { name: "tCredex Plans", href: "/help/tcredex-plans" },
        { name: "Pricing & Payments", href: "/help/payments-faqs" },
      ],
    },
    {
      section: "FAQ & Security",
      items: [
        { name: "General FAQ", href: "/help/frequently-asked-questions" },
        { name: "Is My Data Safe?", href: "/help/data-security" },
      ],
    },
  ];

  return (
    <aside className="mb-16 md:mb-0 md:mr-10 md:w-64 md:shrink-0">
      <nav className="relative rounded-2xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 px-5 py-4 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {section.section}
              </h3>
              <ul className="space-y-1 text-sm">
                {section.items.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      className={`group flex items-center py-1 transition ${
                        pathname === link.href
                          ? "text-indigo-500 font-medium"
                          : "text-indigo-200/65 hover:text-indigo-500"
                      }`}
                      href={link.href}
                    >
                      <span>{link.name}</span>
                      <svg
                        className="ml-2 h-3 w-3 shrink-0 transform fill-current opacity-0 transition group-hover:translate-x-1 group-hover:text-indigo-600 group-hover:opacity-100"
                        viewBox="0 0 12 12"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
