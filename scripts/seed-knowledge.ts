/**
 * Seed Knowledge Base Script
 *
 * Run with: npx tsx scripts/seed-knowledge.ts
 *
 * This seeds the ChatTC knowledge base with foundational tax credit knowledge.
 * Requires: OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables BEFORE any other imports read them
config({ path: resolve(process.cwd(), ".env.local") });

// Types only (no runtime side effects)
import type { KnowledgeCategory } from "../lib/knowledge/types";

// Tax Credit Knowledge Content
const KNOWLEDGE_CONTENT: {
  content: string;
  category: KnowledgeCategory;
  program?: string;
  title: string;
}[] = [
  // NMTC Knowledge
  {
    category: "nmtc",
    program: "NMTC",
    title: "New Markets Tax Credit Program Overview",
    content: `# New Markets Tax Credit (NMTC) Program Overview

## What is the NMTC Program?
The New Markets Tax Credit (NMTC) Program was established by Congress in 2000 as part of the Community Renewal Tax Relief Act. The program is designed to stimulate investment and economic growth in low-income urban and rural communities.

## How It Works
1. **CDFI Fund Allocation**: The Treasury Department's Community Development Financial Institutions (CDFI) Fund allocates tax credit authority to Community Development Entities (CDEs)
2. **Investment Structure**: Investors make Qualified Equity Investments (QEIs) in CDEs
3. **Credit Claim**: Investors receive a 39% federal tax credit over 7 years (5% years 1-3, 6% years 4-7)
4. **Community Investment**: CDEs use the capital to make qualified investments in businesses located in Low-Income Communities (LICs)

## Key Terms
- **CDE (Community Development Entity)**: A domestic corporation or partnership with a primary mission of serving low-income communities
- **QALICB (Qualified Active Low-Income Community Business)**: A business that qualifies to receive NMTC investment
- **QEI (Qualified Equity Investment)**: The investment that generates the tax credit
- **QLICI (Qualified Low-Income Community Investment)**: The loan or investment made by the CDE to the QALICB

## Eligibility Requirements
### Geographic Eligibility
- Project must be located in a Low-Income Community census tract
- LIC tracts have poverty rate ≥20% OR median family income ≤80% of area median

### Business Requirements (QALICB Tests)
1. **Location Test**: At least 50% of gross income from active conduct of business in LIC
2. **Services Test**: At least 40% of tangible property in LIC
3. **Employee Test**: At least 40% of employees' services performed in LIC (for employers with 5+ FTEs)

### Prohibited Uses
- Sin businesses (golf courses, gambling, liquor stores)
- Residential rental property (use LIHTC instead)
- Farming

## Benefits
- Effectively reduces project financing costs by up to 20-25%
- Gap financing for community development projects
- Can be combined with other credits (HTC, state credits)
- Supports job creation in underserved communities

## Common Project Types
- Healthcare facilities and clinics
- Manufacturing facilities
- Charter schools and educational facilities
- Community facilities
- Mixed-use commercial developments
- Grocery stores in food deserts

## tCredex Platform Features for NMTC
- Check tract eligibility using the Map feature
- Submit deals via the Intake Form
- Connect with CDEs through the Marketplace
- Use AutoMatch AI to find suitable CDEs
- Track compliance in the Closing Room`,
  },

  {
    category: "nmtc",
    program: "NMTC",
    title: "NMTC Deal Structure and Pricing",
    content: `# NMTC Deal Structure and Pricing Guide

## Standard NMTC Transaction Structure

### Leverage Loan Structure (Most Common)
1. **Investment Entity (IE)**: Usually LLC formed by investor
2. **Leverage Lender**: Provides loan to IE (often the QALICB or sponsor)
3. **QEI**: IE makes equity investment in CDE
4. **CDE Sub**: CDE makes subsidiary to hold QLICI
5. **QALICB**: Operating entity receives QLICI loan

### Key Relationships
- Investor puts in equity (receives tax credits)
- Leverage loan creates the "put" structure
- CDE fee typically 1-3% annually
- QALICB receives below-market financing

## NMTC Credit Calculation

### 39% Total Credit Over 7 Years
| Year | Credit Rate | Cumulative |
|------|-------------|------------|
| 1 | 5% | 5% |
| 2 | 5% | 10% |
| 3 | 5% | 15% |
| 4 | 6% | 21% |
| 5 | 6% | 27% |
| 6 | 6% | 33% |
| 7 | 6% | 39% |

### Net Benefit Calculation
- QEI Amount: $10,000,000
- Gross Credit: $3,900,000
- Less: Investor fees, compliance costs
- Net Benefit to Project: ~$2,000,000-$2,500,000 (20-25% of QEI)

## Current Market Pricing (2024)

### Credit Pricing
- National average: $0.78-$0.85 per credit dollar
- Actual net benefit varies by:
  - Deal size
  - Geographic location
  - Project type
  - CDE allocation availability

### Fee Structure
- CDE fees: 1-3% of QEI annually
- Asset management: 0.5-1% annually
- Legal/closing costs: $150,000-$300,000
- Compliance monitoring: $10,000-$25,000 annually

## Key Compliance Requirements

### 7-Year Compliance Period
- Substantially all (85%+) of QEI proceeds must remain invested in QLICIs
- QALICB must maintain qualification throughout
- Annual reporting to CDFI Fund required

### Recapture Events
- CDE ceases to be certified
- QEI redeemed before 7 years
- QALICB fails qualification tests
- Less than substantially all invested in QLICIs

## Exit at Year 7
- Leverage loan "put" exercise
- Investor exits with nominal payment ($1,000)
- Project typically retains assets
- Below-market financing converts to ownership`,
  },

  // LIHTC Knowledge
  {
    category: "lihtc",
    program: "LIHTC",
    title: "Low-Income Housing Tax Credit Program Overview",
    content: `# Low-Income Housing Tax Credit (LIHTC) Program Overview

## What is LIHTC?
The Low-Income Housing Tax Credit is the most successful affordable housing production program in U.S. history. Created by the Tax Reform Act of 1986, LIHTC has helped finance over 3 million affordable rental housing units.

## Types of Credits

### 9% Credit (Competitive)
- Approximately 9% credit annually for 10 years
- Total credit = ~90% of qualified basis
- Awarded competitively by state housing finance agencies
- Used for new construction or substantial rehabilitation
- Does NOT require tax-exempt bonds

### 4% Credit (As-of-Right)
- Approximately 4% credit annually for 10 years
- Total credit = ~40% of qualified basis
- Available as-of-right with 50%+ tax-exempt bond financing
- Used for acquisition/rehabilitation or new construction
- More commonly available, less competitive

## Qualification Requirements

### Income Limits
Projects must meet ONE of these tests:
- **20-50 Test**: At least 20% of units rent to households at ≤50% AMI
- **40-60 Test**: At least 40% of units rent to households at ≤60% AMI
- **Average Income Test**: Average income limit across units is ≤60% AMI (allows some units up to 80% AMI)

### Rent Limits
- Maximum gross rent (including utilities) cannot exceed 30% of the applicable income limit
- Rent limits published annually by HUD for each county

### Use Restrictions
- Minimum 15-year compliance period
- Additional 15-year extended use period (total 30 years)
- Land use restriction agreement (LURA) recorded

## Credit Calculation

### Eligible Basis
- Cost of land: NOT included
- Building costs: Included
- Site work directly related to building: Included
- Architect/engineering fees: Included
- Developer fee: Included (with limits)

### Qualified Basis
Eligible Basis × Applicable Fraction (% of LIHTC units)

### Basis Boost (130%)
Available for projects in:
- Qualified Census Tracts (QCTs)
- Difficult Development Areas (DDAs)
- State-designated boost areas

### Annual Credit
Qualified Basis × Credit Percentage (4% or 9%)

## Syndication Process

### Key Players
1. **Developer/Sponsor**: Creates and manages the project
2. **Syndicator**: Packages credits for sale to investors
3. **Investor**: Purchases credits (typically large corporations)
4. **Housing Finance Agency**: Awards and monitors credits

### Pricing
- 9% credits: $0.90-$1.00+ per credit dollar
- 4% credits: $0.85-$0.95 per credit dollar
- Pricing varies by market, developer experience, project type

## tCredex Platform Features for LIHTC
- Find LIHTC deals in the Marketplace
- Connect with syndicators and investors
- Use Pricing Coach for guidance
- Track compliance deadlines`,
  },

  // HTC Knowledge
  {
    category: "htc",
    program: "HTC",
    title: "Historic Tax Credit Program Overview",
    content: `# Historic Tax Credit (HTC) Program Overview

## What is the HTC Program?
The Federal Historic Tax Credit provides a 20% credit for the rehabilitation of certified historic structures. The program encourages private sector investment in historic preservation and sustainable reuse of existing buildings.

## Credit Amount
- **20% Federal Credit**: For certified historic structures
- Can be combined with state historic credits (varies by state)
- Credits taken in year building is placed in service

## Qualifying Buildings

### Certified Historic Structure
Building must be:
1. Listed on the National Register of Historic Places, OR
2. Located in a registered historic district AND certified as contributing to the historic significance of the district

### Certification Process
Three-part application to National Park Service (NPS):
- **Part 1**: Certification of significance (is building historic?)
- **Part 2**: Description of rehabilitation (does work meet standards?)
- **Part 3**: Certification of completed work

## Secretary of Interior's Standards for Rehabilitation

### 10 Standards (Summary)
1. Use property for historic purpose or compatible new use
2. Retain historic character
3. Recognize property as physical record of its time
4. Preserve distinctive features
5. Preserve distinctive features and craftsmanship
6. Repair rather than replace
7. Avoid harsh chemical or physical treatments
8. Protect archaeological resources
9. New work shall be compatible but differentiated
10. New work shall be reversible

## Qualified Rehabilitation Expenditures (QREs)

### Included
- Walls, floors, ceilings
- Permanent coverings (flooring, wall coverings)
- Windows and doors
- HVAC systems
- Plumbing and electrical systems
- Architectural and engineering fees
- Construction management fees

### NOT Included
- Acquisition costs
- Furniture and equipment
- Landscaping
- New construction/additions (separate structure)
- Parking structures

## Substantial Rehabilitation Test
Must spend MORE than:
- $5,000, OR
- Adjusted basis of building (purchase price minus land)
- Measured over 24-month period (60-month for phased)

## Deal Structure

### Direct Investment
- Owner claims credits directly
- Requires sufficient tax liability

### Syndicated Structure
- Credits sold to investors
- Similar to NMTC structure
- Master tenant arrangement common

### Pricing
- Current market: $0.85-$0.95 per credit dollar
- Varies by project size, location, developer experience

## Common Combinations
- **HTC + LIHTC**: Historic affordable housing
- **HTC + NMTC**: Community facilities in historic buildings
- **HTC + State Credits**: Maximum benefit layering

## Timeline
1. Part 1 approval: 1-3 months
2. Part 2 approval: 2-4 months
3. Construction: Varies
4. Part 3 certification: 1-3 months post-completion
5. Credits claimed: Tax year placed in service`,
  },

  // Opportunity Zones
  {
    category: "oz",
    program: "OZ",
    title: "Opportunity Zones Program Overview",
    content: `# Opportunity Zones (OZ) Program Overview

## What are Opportunity Zones?
Created by the Tax Cuts and Jobs Act of 2017, Opportunity Zones provide capital gains tax incentives for investments in designated low-income census tracts. The program aims to spur economic development in underserved communities.

## Tax Benefits

### Three Main Incentives
1. **Deferral**: Defer capital gains taxes until December 31, 2026
2. **Reduction**: 10% step-up in basis after 5 years (expired 12/31/2021)
3. **Exclusion**: 100% exclusion of NEW gains if held 10+ years

### Current Benefits (Post-2021)
- Deferral through 12/31/2026
- 100% exclusion of appreciation on OZ investment if held 10+ years
- No step-up benefit remains (5/7 year windows have passed)

## Investment Structure

### Qualified Opportunity Fund (QOF)
- Corporation or partnership organized to invest in OZ property
- Must hold at least 90% of assets in Qualified OZ Property
- Self-certification on Form 8996

### Qualified OZ Property Types
1. **QOZ Stock**: Stock in domestic corporation that is QOZB
2. **QOZ Partnership Interest**: Interest in partnership that is QOZB
3. **QOZ Business Property**: Tangible property used in QOZB

### Qualified OZ Business (QOZB) Requirements
- At least 70% of tangible property is QOZBP
- At least 50% of gross income from active business in OZ
- Less than 5% of property is financial property
- Less than 5% nonqualified financial property
- No sin businesses

## Key Rules

### 180-Day Investment Window
- Must invest capital gains within 180 days of recognition
- Different start dates for pass-through entities

### Substantial Improvement Test (for Buildings)
- Must double adjusted basis within 30 months
- Original use OR substantial improvement
- Land never requires improvement

### Working Capital Safe Harbor
- 31-month period to deploy capital
- Must have written plan and schedule
- COVID extensions may apply

## Common Investment Types

### Real Estate
- Ground-up development
- Substantial rehabilitation
- Mixed-use projects
- Affordable housing with LIHTC

### Operating Businesses
- Manufacturing
- Technology startups
- Healthcare facilities
- Renewable energy

## Combining OZ with Other Credits

### OZ + NMTC
- Many OZ tracts also qualify for NMTC
- Separate structures required
- Benefits can be additive

### OZ + LIHTC
- Affordable housing in OZs common
- LIHTC syndication + OZ equity
- Complex but powerful combination

### OZ + HTC
- Historic buildings in OZs
- Substantial improvement may satisfy both tests
- Careful structuring required

## tCredex Platform Features
- Map shows OZ designations
- Filter marketplace by OZ-eligible
- Connect with QOF managers
- Pricing guidance for OZ investments

## Key Deadlines
- Original gains: Recognized anytime
- Investment deadline: 180 days from recognition
- Deferral ends: December 31, 2026
- 10-year hold: Must hold through 2027+ for full exclusion`,
  },

  // Platform Knowledge
  {
    category: "platform",
    title: "tCredex Platform Guide",
    content: `# tCredex Platform Guide

## What is tCredex?
tCredex is an AI-powered tax credit marketplace platform that connects borrowers, CDEs, syndicators, and investors for NMTC, LIHTC, HTC, and Opportunity Zone transactions.

## Key Features

### 1. Interactive Map
- Check any address for NMTC/OZ eligibility
- View census tract qualifications
- See AMI levels and poverty rates
- Identify QCTs and DDAs for LIHTC basis boost

### 2. Deal Intake Form
- Submit deals in approximately 20 minutes
- Guided questions for all required information
- Automatic scoring and readiness assessment
- Document checklist generation

### 3. Marketplace
- Browse available deals by program type
- Filter by state, allocation amount, project type
- View deal summaries and key metrics
- Express interest directly through platform

### 4. AutoMatch AI
- AI-powered matching of projects to CDEs/investors
- Considers allocation types, geographic preferences
- Scores compatibility based on multiple factors
- Suggests optimal pairings

### 5. Pricing Coach
- Guidance on current market pricing
- Program-specific benchmarks
- Regional variations
- Fee structure expectations

### 6. Closing Room
- Document management
- Compliance tracking
- Timeline management
- Stakeholder communication

## User Roles

### Borrowers/Sponsors
- Submit project deals
- Track deal progress
- Manage documents
- Connect with capital providers

### CDEs
- Browse eligible projects
- Express interest in deals
- Manage allocations
- Track pipeline

### Investors
- Review investment opportunities
- Due diligence tools
- Portfolio management
- Compliance monitoring

### Syndicators
- Package deals for investors
- Market LIHTC/HTC credits
- Manage investor relationships
- Track placements

## Getting Started

### Step 1: Create Account
- Sign up at tcredex.com
- Complete organization profile
- Verify email

### Step 2: Submit a Deal
- Click "Submit Deal" in sidebar
- Complete intake form
- Upload supporting documents
- Submit for review

### Step 3: Track Progress
- View deal in Dashboard
- Monitor readiness score
- Respond to information requests
- Connect with matches

## Support

### Platform Support
For account issues, technical problems, platform questions:
- Email: support@tcredex.com
- Support Portal: tcredex.com/support
- Live Chat: Available on platform

### Tax Credit Advisory
For deal structuring, CDE matching, transaction support:
- American Impact Ventures (AIV)
- Email: deals@americanimpactventures.com
- Consultation: tcredex.com/contact-aiv`,
  },

  // Compliance Knowledge
  {
    category: "compliance",
    title: "Tax Credit Compliance Guide",
    content: `# Tax Credit Compliance Guide

## NMTC Compliance

### 7-Year Compliance Period
- Begins on date of QEI
- "Substantially all" (85%+) must remain invested
- Annual reporting to CDFI Fund required

### Key Requirements
1. **QALICB Maintenance**: Business must remain qualified
2. **Investment Tracking**: QLICIs properly deployed
3. **Reporting**: Annual reports to CDFI Fund
4. **Record Keeping**: 6+ years after compliance period

### Recapture Triggers
- CDE loses certification
- Less than substantially all invested
- QEI redeemed early
- QALICB fails tests

### Recapture Calculation
Full credit claimed to date becomes payable
Plus interest from due dates

## LIHTC Compliance

### 15-Year Compliance Period
- Plus 15-year extended use period
- Annual certification required
- State HFA monitoring

### Key Requirements
1. **Income Limits**: Tenant income verification
2. **Rent Limits**: Maximum gross rent compliance
3. **Occupancy**: Minimum set-aside maintained
4. **Physical Standards**: Property maintained per standards

### Annual Requirements
- Tenant income certifications
- Rent roll reporting
- Physical inspections
- Financial reporting

### Recapture
- Accelerated portion of credit
- Based on % of compliance period remaining
- Triggered by disposition or noncompliance

## HTC Compliance

### Post-Certification Requirements
- Maintain historic character
- No unauthorized alterations
- 5-year recapture period

### Recapture Triggers
- Disposition within 5 years
- Unauthorized alterations
- Loss of historic certification

### Recapture Calculation
20% reduction each year
- Year 1: 100% recapture
- Year 2: 80% recapture
- Year 3: 60% recapture
- Year 4: 40% recapture
- Year 5: 20% recapture

## Opportunity Zone Compliance

### QOF Requirements
- 90% asset test (semi-annual)
- Quarterly testing recommended
- Form 8996 filing

### QOZB Requirements
- 70% tangible property in zone
- 50% gross income test
- Less than 5% financial assets

### Penalties
- Failure to meet 90% test: Monthly penalty
- Penalty = (shortfall amount) × (applicable rate)

## Best Practices

### Documentation
- Maintain complete files
- Regular internal audits
- Legal review of changes
- Proactive monitoring

### Reporting
- Meet all deadlines
- Accurate information
- Retain copies
- Track submissions

### Professional Support
- Engage compliance counsel
- Annual third-party review
- Training for staff
- Stay current on guidance`,
  },

  // Credit Stacking
  {
    category: "general",
    title: "Credit Stacking Strategies",
    content: `# Tax Credit Stacking Strategies

## What is Credit Stacking?
Credit stacking combines multiple tax credit programs on a single project to maximize financial benefit. Proper structuring is essential to preserve all benefits.

## Common Combinations

### LIHTC + HTC
**Best For**: Historic buildings converted to affordable housing

**Structure**:
- Master tenant structure for HTC
- LIHTC partnership owns/leases building
- Separate investor groups possible

**Benefits**:
- Historic preservation
- Affordable housing production
- Maximum subsidy for difficult projects

**Challenges**:
- Basis allocation between credits
- Competing compliance requirements
- Complex legal structure

### NMTC + HTC
**Best For**: Community facilities in historic buildings

**Structure**:
- HTC partnership owns building
- NMTC leverage loan funds rehabilitation
- Careful timing of HTC placed-in-service

**Benefits**:
- Maximum financing for historic community projects
- Below-market NMTC financing + HTC credits
- Strong community development impact

**Challenges**:
- QRE vs. QLICI basis allocation
- 7-year NMTC vs. 5-year HTC recapture
- Complex exit planning

### NMTC + LIHTC
**Best For**: Mixed-use projects with affordable housing

**Structure**:
- LIHTC for residential component
- NMTC for commercial/community space
- Separate legal entities typical

**Benefits**:
- Both residential and community benefits
- Maximum financing for mixed-use
- Separate investor pools

**Challenges**:
- Must clearly segregate uses
- Different compliance periods
- Allocation methodology critical

### OZ + NMTC
**Best For**: Projects in overlapping zones

**Structure**:
- QOF invests in QOZB
- QOZB receives NMTC financing
- Can be same or different entities

**Benefits**:
- Capital gains benefits + NMTC credits
- Multiple incentive layers
- Significant financing advantage

**Challenges**:
- Substantial improvement test alignment
- Different compliance requirements
- Complex investor preferences

### OZ + LIHTC
**Best For**: Affordable housing in Opportunity Zones

**Structure**:
- QOF provides equity to LIHTC partnership
- LIHTC syndication fills remaining equity
- OZ gain exclusion for QOF investors

**Benefits**:
- Affordable housing in underserved areas
- OZ benefits + LIHTC credits
- Multiple investor types

**Challenges**:
- Competing return expectations
- Complex partnership structure
- Long hold requirements for OZ

## Key Principles

### 1. Basis Allocation
- Cannot double-count basis
- Careful allocation between programs
- Document methodology clearly

### 2. Compliance Coordination
- Identify all requirements upfront
- Create unified compliance calendar
- Single point of responsibility

### 3. Exit Planning
- Map all recapture periods
- Plan investor exits carefully
- Document long-term strategy

### 4. Legal Structure
- Separate entities as needed
- Clear relationships documented
- Tax opinion for complex structures

## When to Stack

### Good Candidates
- Large projects with multiple uses
- Historic buildings needing significant rehab
- Projects in overlapping eligible areas
- Deals with experienced sponsors

### Poor Candidates
- Small projects (fees outweigh benefits)
- Inexperienced sponsors
- Tight timelines
- Projects with unclear eligibility

## Professional Support
Credit stacking requires experienced professionals:
- Tax attorney with multi-credit experience
- Accountant familiar with all programs
- Development consultant
- Compliance monitor

**For stacking expertise, contact American Impact Ventures**: deals@americanimpactventures.com`,
  },
];

async function seedKnowledge() {
  console.log("Starting knowledge base seeding...\n");

  // Check environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY not set in .env.local");
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY not set in .env.local");
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL not set in .env.local");
    process.exit(1);
  }

  console.log("Environment variables loaded successfully.");
  console.log(`  Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  // Dynamic import so vectorStore.ts reads env vars AFTER dotenv loaded them
  const { ingestDocument } = await import("../lib/knowledge/ingest");

  let successCount = 0;
  let errorCount = 0;

  for (const item of KNOWLEDGE_CONTENT) {
    console.log(`\nIngesting: ${item.title}...`);

    try {
      const result = await ingestDocument(
        {
          buffer: Buffer.from(item.content, "utf-8"),
          filename: `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
          mimeType: "text/markdown",
        },
        {
          category: item.category,
          program: item.program,
          title: item.title,
          source: "tCredex Knowledge Base",
          uploadedBy: "system",
        },
      );

      if (result.status === "success") {
        console.log(`  SUCCESS: Created ${result.chunksCreated} chunks`);
        successCount++;
      } else {
        console.log(`  ERROR: ${result.error}`);
        errorCount++;
      }
    } catch (error: unknown) {
      console.log(
        `  ERROR: ${error instanceof Error ? error.message : String(error)}`,
      );
      errorCount++;
    }
  }

  console.log("\n========================================");
  console.log(`Seeding complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log("========================================\n");
}

// Run the seeding
seedKnowledge().catch(console.error);
