import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are ChatTC, an expert AI assistant specializing in U.S. federal tax credit programs. You have deep technical knowledge equivalent to a seasoned tax credit attorney or accountant with 20+ years of experience in community development finance.

## YOUR DEEP EXPERTISE

### NMTC (New Markets Tax Credit)
- **Credit Structure**: 39% of Qualified Equity Investment (QEI) claimed over 7 years (5% years 1-3, 6% years 4-7)
- **Investment Flow**: Investor -> CDE (via QEI) -> QALICB (via QLICI) -> Project
- **QALICB Tests**: Location test (tract must have >=20% poverty OR <=80% MFI), business test, size test (<$15M gross income, <200 employees)

### LIHTC (Low-Income Housing Tax Credit)
- **9% Credit**: Competitive, ~8.8% annually for 10 years
- **4% Credit**: As-of-right with tax-exempt bonds

### HTC (Historic Tax Credit)
- **Credit Amount**: 20% of Qualified Rehabilitation Expenditures (QREs)

### Opportunity Zones
- **180-Day Rule**: Must invest capital gain within 180 days
- **10-Year Exclusion**: 100% exclusion of NEW appreciation if held 10+ years

## PLATFORM CONTEXT
You work for tCredex, an AI-powered tax credit marketplace currently in beta. The platform:
- **MAP**: Check any address for NMTC/OZ eligibility via census tract data
- **Marketplace**: CDEs/Investors browse and filter deals
- **AutoMatch**: AI matches deals with best-fit CDEs

## CONTACT INFO (only if specifically asked)
- Platform support: support@tcredex.com
- Advisory services: American Impact Ventures at deals@americanimpactventures.com`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ content: 'Invalid request format' }, { status: 400 });
    }

    const userMessage = messages[messages.length - 1]?.content || '';
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    if (!openaiKey) {
      return NextResponse.json({ content: getFallbackResponse(userMessage) });
    }

    const model = process.env.CHAT_MODEL || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        temperature: 0.7,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ content: getFallbackResponse(userMessage) });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: getFallbackResponse(userMessage) })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (!trimmed.startsWith('data: ')) continue;

              try {
                const json = JSON.parse(trimmed.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        } catch (streamError) {
          console.error('Stream error:', streamError);
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      content: "I'm having a brief technical issue. Ask me about NMTC, LIHTC, HTC, Opportunity Zones, or how to use tCredex!",
    });
  }
}

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('nmtc') || lower.includes('new markets')) {
    return `The New Markets Tax Credit provides a **39% federal tax credit** over 7 years (5% years 1-3, 6% years 4-7). Your project must be in a census tract with >=20% poverty OR <=80% MFI. Use tCredex's Map to check any address instantly. What would you like to know about NMTC?`;
  }

  if (lower.includes('lihtc') || lower.includes('housing credit')) {
    return `LIHTC has two types: **9% Credit** (competitive, ~88% total) and **4% Credit** (as-of-right with tax-exempt bonds, ~35% total). Income requirements include 20-50 test or 40-60 test. What aspect of LIHTC would you like to explore?`;
  }

  if (lower.includes('htc') || lower.includes('historic')) {
    return `The Historic Tax Credit provides a **20% credit** on Qualified Rehabilitation Expenditures. Building must be on the National Register or in a certified historic district. What would you like to know more about?`;
  }

  if (lower.includes('oz') || lower.includes('opportunity zone')) {
    return `Opportunity Zones offer capital gains tax benefits. Key rules: 180-day investment window, 10-year hold for 100% exclusion of new appreciation, and substantial improvement test for existing buildings. What specific aspect would you like to explore?`;
  }

  return `I'm ChatTC, your tax credit expert. I can help with:\n\n- **NMTC** (39% credit for community investments)\n- **LIHTC** (9%/4% credits for affordable housing)\n- **HTC** (20% credit for historic rehabilitation)\n- **Opportunity Zones** (capital gains benefits)\n- **Credit stacking** and deal structuring\n\nWhat would you like to know?`;
}
