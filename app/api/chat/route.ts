import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSystemPrompt } from "@/lib/knowledge/retriever";
import type { Citation } from "@/lib/knowledge/types";
import fs from "fs";
import path from "path";

// Helper to read help files for RAG context - OPTIMIZED for speed
function getHelpFilesContext(): string {
  try {
    const helpDir = path.join(process.cwd(), "content/help");
    if (!fs.existsSync(helpDir)) return "";

    const files = fs.readdirSync(helpDir);
    const helpContent = files
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
      .slice(0, 5) // Reduced from 10 to 5 files for speed
      .map((file) => {
        try {
          const content = fs.readFileSync(path.join(helpDir, file), "utf-8");
          // Extract just the content, skip frontmatter
          const parts = content.split("---");
          const body = parts.length > 2 ? parts.slice(2).join("---") : content;
          // Truncate more aggressively for speed
          return `\n[${file}]\n${body.slice(0, 1000)}`;
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join("\n");

    return helpContent;
  } catch {
    return "";
  }
}

const BASE_SYSTEM_PROMPT = `You are ChatTC, an expert AI assistant specializing in U.S. federal tax credit programs. You have deep technical knowledge equivalent to a seasoned tax credit attorney or accountant with 20+ years of experience in community development finance.

## YOUR DEEP EXPERTISE

### NMTC (New Markets Tax Credit)
- **Credit Structure**: 39% of Qualified Equity Investment (QEI) claimed over 7 years (5% years 1-3, 6% years 4-7)
- **Investment Flow**: Investor → CDE (via QEI) → QALICB (via QLICI) → Project
- **QALICB Tests**: Location test (tract must have ≥20% poverty OR ≤80% MFI), business test (active trade/business), size test (<$15M gross income, <200 employees)
- **Eligible Uses**: Manufacturing, retail, office, community facilities, healthcare, nonprofits, mixed-use
- **Typical Pricing**: 70-80 cents per dollar of credit (varies by market conditions)
- **CDEs**: Must have 501(c) status, primary mission of serving LICs, accountability to residents
- **Allocation Rounds**: Annual competitive awards from CDFI Fund, typically $3-5B awarded yearly
- **Compliance**: 7-year compliance period, recapture risk, CDFI Fund reporting

### LIHTC (Low-Income Housing Tax Credit)
- **9% Credit**: Competitive, awarded by state HFAs via QAP scoring. ~8.8% annually for 10 years (≈88% total)
- **4% Credit**: As-of-right with tax-exempt bonds (50% test). ~3.5% annually for 10 years (≈35% total)
- **Income Limits**: 20-50 test (20% at 50% AMI) OR 40-60 test (40% at 60% AMI). Income averaging now allows up to 80% AMI
- **Compliance**: 15-year compliance period + 15-year extended use period (30 total minimum)
- **Basis Boost**: 130% boost for DDA, QCT, or state-designated areas
- **Syndication**: Credits sold to investors at 85-95 cents per dollar depending on market
- **QAP Priority**: Each state prioritizes differently - check state HFA for scoring criteria

### HTC (Historic Tax Credit)
- **Credit Amount**: 20% of Qualified Rehabilitation Expenditures (QREs) for NPS-certified projects
- **Qualification**: Building on National Register of Historic Places OR contributing to certified historic district
- **QREs**: Include construction costs, architectural/engineering, but NOT acquisition, furniture, site work, new construction
- **Substantial Rehabilitation Test**: QREs must exceed greater of $5,000 OR adjusted basis
- **NPS Process**: Part 1 (significance) → Part 2 (proposed work) → Part 3 (completed work certification)
- **5-Year Recapture**: Must hold 5 years or recapture portion of credit
- **Secretary's Standards**: 10 Standards for Rehabilitation - sensitive to historic character
- **Timing**: Credits taken in year building placed in service

### Opportunity Zones
- **180-Day Rule**: Must invest capital gain within 180 days of recognition event into QOF
- **QOF Requirements**: 90% of assets must be QOZP (tested semi-annually)
- **Substantial Improvement**: For existing buildings, must invest equal to basis within 30 months
- **10-Year Exclusion**: 100% exclusion of NEW appreciation if held 10+ years
- **Deferral Deadline**: Deferred gain recognized December 31, 2026 (or earlier disposition)
- **Land Exception**: Land not counted for substantial improvement test
- **Working Capital Safe Harbor**: 31 months to deploy capital with written plan

### Credit Stacking Strategies
- **NMTC + HTC**: Historic community facility. Structure: Leverage loan + HTC equity + NMTC equity
- **LIHTC + HTC**: Historic affordable housing. Must coordinate QRE basis calculations
- **NMTC + LIHTC**: Rare, complex. Usually NMTC funds community space, LIHTC handles residential
- **OZ + Any Credit**: OZ can wrap around other credits. QOF invests in structure holding credits
- **State Credits**: Many states offer additional credits (MA, MO, etc.) that can layer

## CONVERSATION STYLE
- Answer questions directly with specifics, numbers, and examples
- Think through problems step-by-step when asked about deal structuring
- Use your expertise - don't just refer to outside help for every question
- Be conversational but substantive - like talking to a knowledgeable colleague
- When you cite numbers/rules, be confident about well-established facts
- For truly ambiguous/novel situations, acknowledge uncertainty honestly

## PLATFORM CONTEXT
You work for tCredex, an AI-powered tax credit marketplace. The platform:
- **MAP**: Check any address for NMTC/OZ eligibility via census tract data
- **Intake Form**: Sponsors submit deals for marketplace listing
- **Marketplace**: CDEs/Investors browse and filter deals by program, location, size
- **AutoMatch**: AI matches deals with best-fit CDEs based on geography, sector, mission alignment
- **Closing Room**: Document management and closing coordination

## CONTACT INFO (only if specifically asked)
- Platform support: support@tcredex.com
- Advisory services: American Impact Ventures at deals@americanimpactventures.com`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { content: "Invalid request format", citations: [] },
        { status: 400 },
      );
    }

    const userMessage = messages[messages.length - 1]?.content || "";
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    // If no API key, use fallback responses
    if (!openaiKey) {
      console.log("No OPENAI_API_KEY configured, using fallback");
      return NextResponse.json({
        content: getFallbackResponse(userMessage),
        citations: [],
      });
    }

    // Get enhanced system prompt with RAG context (if knowledge base has content)
    let systemPrompt = BASE_SYSTEM_PROMPT;
    let _citations: Citation[] = [];

    // First, try to get help files context (always available)
    const helpFilesContext = getHelpFilesContext();
    if (helpFilesContext) {
      systemPrompt += `\n\n## HELP DOCUMENTATION CONTEXT\nUse this documentation to help answer user questions about the platform:\n${helpFilesContext}`;
      console.log("[ChatTC] Added help files context to prompt");
    }

    // Then, try vector-based RAG (if available)
    try {
      const ragResult = await getEnhancedSystemPrompt(
        BASE_SYSTEM_PROMPT,
        userMessage,
      );
      if (ragResult.chunksUsed > 0) {
        // Append RAG context to the prompt (don't replace)
        systemPrompt += `\n\n## ADDITIONAL KNOWLEDGE BASE CONTEXT\n${ragResult.systemPrompt.replace(BASE_SYSTEM_PROMPT, "")}`;
        _citations = ragResult.citations;
        console.log(
          `[ChatTC] Retrieved ${ragResult.chunksUsed} knowledge chunks for query`,
        );
      }
    } catch (_ragError) {
      // RAG failed - continue with base + help files prompt
      console.log("[ChatTC] Vector RAG unavailable, using help files context");
    }

    // Call OpenAI ChatGPT API with STREAMING for fast response
    // Use gpt-4o-mini for speed, gpt-4o for complex questions
    const model = process.env.CHAT_MODEL || "gpt-4o-mini"; // Faster default

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500, // Reduced for speed
        temperature: 0.7,
        stream: true, // Enable streaming!
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);

      // Fall back to hardcoded response on API error
      return NextResponse.json({
        content: getFallbackResponse(userMessage),
        citations: [],
      });
    }

    // Return streaming response for fast perceived performance
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: getFallbackResponse(userMessage) })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;
              if (!trimmed.startsWith("data: ")) continue;

              try {
                const json = JSON.parse(trimmed.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                  );
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        } catch (streamError) {
          console.error("Stream error:", streamError);
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    // Always return a valid response, never throw
    return NextResponse.json({
      content:
        "I'm having a brief technical issue, but I can still help! Ask me about NMTC, LIHTC, HTC, Opportunity Zones, credit stacking, or how to use tCredex. What would you like to know?",
      citations: [],
    });
  }
}

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  // NMTC-specific questions
  if (lower.includes("nmtc") || lower.includes("new markets")) {
    return `The New Markets Tax Credit provides a **39% federal tax credit** over 7 years (5% years 1-3, 6% years 4-7).

**How it works:**
- Investor makes a Qualified Equity Investment (QEI) into a CDE
- CDE provides a Qualified Low-Income Community Investment (QLICI) to your project
- Investor claims 39% of their QEI as tax credits

**Your project must pass QALICB tests:**
- Located in a census tract with ≥20% poverty OR ≤80% median family income
- Active trade or business (not residential rental)
- Under $15M gross income, under 200 employees

**Current pricing:** 70-80 cents per credit dollar, depending on market conditions and deal quality.

What specifically would you like to know about NMTC?`;
  }

  // LIHTC questions
  if (
    lower.includes("lihtc") ||
    lower.includes("housing credit") ||
    (lower.includes("affordable") && lower.includes("housing"))
  ) {
    return `The Low-Income Housing Tax Credit has two types:

**9% Credit (Competitive):**
- ~8.8% annually for 10 years ≈ 88% total credit
- Awarded competitively by state housing agencies via QAP scoring
- Higher value but harder to get

**4% Credit (As-of-Right):**
- ~3.5% annually for 10 years ≈ 35% total credit
- Paired with tax-exempt bonds (50% test)
- Easier to obtain, lower credit value

**Income requirements:**
- 20-50 test: 20% of units at ≤50% AMI, OR
- 40-60 test: 40% of units at ≤60% AMI
- Income averaging now allows some units up to 80% AMI

**Current pricing:** 85-95 cents per credit dollar depending on market.

What aspect of LIHTC would you like me to explain further?`;
  }

  // HTC questions
  if (lower.includes("htc") || lower.includes("historic")) {
    return `The Historic Tax Credit provides a **20% credit** on Qualified Rehabilitation Expenditures (QREs).

**Eligibility:**
- Building listed on National Register of Historic Places, OR
- Contributing building in a certified historic district
- Must pass "substantial rehabilitation" test (QREs > adjusted basis or $5,000)

**QREs include:** Construction, architectural/engineering fees
**QREs exclude:** Acquisition, furniture, site work, new construction

**NPS Process:**
1. **Part 1**: Certifies building's historic significance
2. **Part 2**: Approves proposed rehabilitation plans
3. **Part 3**: Certifies completed work meets standards

Credits claimed in the year the building is placed in service. 5-year recapture period.

What would you like to know more about?`;
  }

  // OZ questions
  if (lower.includes("oz") || lower.includes("opportunity zone")) {
    return `Opportunity Zones offer capital gains tax benefits for investments in designated census tracts.

**Key rules:**
- **180-day rule**: Invest capital gain within 180 days of recognition
- **10-year exclusion**: Hold 10+ years → 100% exclusion of NEW appreciation
- **Deferral deadline**: Original deferred gain recognized Dec 31, 2026

**Substantial improvement test:**
- For existing buildings, must invest ≥ building's basis within 30 months
- Land excluded from calculation

**QOF requirements:**
- 90% of assets must be Qualified OZ Property
- Tested semi-annually

The 10-year exclusion on NEW gains is the real benefit now - the original basis reduction benefits have expired.

What specific aspect of OZ would you like to explore?`;
  }

  // Stacking questions
  if (
    lower.includes("stack") ||
    lower.includes("combine") ||
    lower.includes("layer")
  ) {
    return `Credit stacking lets you maximize benefits by combining programs on one project:

**Common combinations:**
- **NMTC + HTC**: Historic community facilities (healthcare, education, nonprofit)
- **LIHTC + HTC**: Historic affordable housing - very common, well-established structures
- **OZ + NMTC/HTC/LIHTC**: OZ can wrap around any of these for additional tax-advantaged capital

**Key considerations:**
- Basis adjustments between programs
- Different compliance periods and requirements
- Investor syndication complexity
- State credits can often be added on top

The most common mistake is not properly reducing basis for HTC when combining with LIHTC.

Which combination are you considering?`;
  }

  // Eligibility questions
  if (
    lower.includes("eligib") ||
    lower.includes("qualify") ||
    lower.includes("does my project")
  ) {
    return `Eligibility depends on the program:

**NMTC**: Census tract must have ≥20% poverty OR ≤80% MFI. Use tCredex's Map to check any address instantly.

**LIHTC**: Rental housing with income-restricted tenants. Apply through your state's Housing Finance Agency.

**HTC**: Building must be on National Register or in a certified historic district.

**OZ**: Must be in a designated Opportunity Zone tract. Check the Map.

What type of project are you working on? I can help you figure out which programs fit.`;
  }

  // Platform questions
  if (
    lower.includes("tcredex") ||
    lower.includes("platform") ||
    lower.includes("how do i") ||
    lower.includes("intake")
  ) {
    return `Here's how tCredex works:

**For Sponsors (Deal Owners):**
- Use the Intake Form to submit your deal (~20 minutes)
- Your deal gets listed on the Marketplace
- CDEs and investors can find and express interest

**For CDEs:**
- Browse the Marketplace to find deals in your target areas
- Use AutoMatch to find deals aligned with your mission
- Express interest and initiate LOI process

**Key Features:**
- **Map**: Check any address for NMTC/OZ eligibility
- **Marketplace**: Filter by program, state, allocation size
- **AutoMatch**: AI-powered deal-CDE matching

What are you trying to do?`;
  }

  // Default - be conversational
  return `I'm ChatTC, your tax credit expert. I can help with:

- **NMTC** (39% credit for community investments)
- **LIHTC** (9%/4% credits for affordable housing)
- **HTC** (20% credit for historic rehabilitation)
- **Opportunity Zones** (capital gains benefits)
- **Credit stacking** and deal structuring

I can also help you use the tCredex platform - checking eligibility, submitting deals, or finding CDEs.

What would you like to know?`;
}
