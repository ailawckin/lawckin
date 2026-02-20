import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRACTICE_AREAS = [
  "Family & Divorce",
  "Immigration",
  "Business / Startup",
  "Criminal Defense",
  "Employment / Workplace",
  "Real Estate (Transactions)",
  "Landlord–Tenant (Housing)",
  "Personal Injury",
  "Estate & Probate",
  "Bankruptcy & Debt",
  "Intellectual Property",
  "Consumer / Small Claims",
  "General Legal Guidance",
];

interface IntakeRequest {
  description: string;
  location?: string | null;
  urgency?: string | null;
  budget_band?: string | null;
  preferred_language?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: IntakeRequest = await req.json();

    const minWords = 8;
    const wordCount = body.description?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    if (!body.description || wordCount < minWords) {
      return new Response(
        JSON.stringify({ error: `Description is required (${minWords}+ words).` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not configured." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const systemPrompt = `You are a legal intake classifier. Return JSON only.
Choose a practice_area from this list:
${PRACTICE_AREAS.join(", ")}

Rules:
- Provide a short summary without personally identifying details.
- specific_issue should be a short phrase if relevant, otherwise null.
- keywords should be 3-6 short phrases.
- confidence should be between 0 and 1.
- urgency, budget_band, preferred_language can be null if unknown.
`;

    const userPrompt = `Client description: ${body.description}
Location: ${body.location ?? ""}
Urgency: ${body.urgency ?? ""}
Budget band: ${body.budget_band ?? ""}
Preferred language: ${body.preferred_language ?? ""}`;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_object",
        },
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return new Response(
        JSON.stringify({ error: "OpenAI request failed", detail: errorText }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const payload = await openAiResponse.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "OpenAI response missing content" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const rawOutput = JSON.parse(content);
    const normalizePracticeArea = (value: unknown) => {
      if (typeof value !== "string") return "General Legal Guidance";
      const match = PRACTICE_AREAS.find((area) => area.toLowerCase() === value.toLowerCase());
      return match || "General Legal Guidance";
    };

    const safeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
    const safeKeywords = (value: unknown) =>
      Array.isArray(value)
        ? value.map((item) => safeString(item)).filter(Boolean).slice(0, 6)
        : [];

    const output = {
      practice_area: normalizePracticeArea(rawOutput?.practice_area),
      specific_issue: safeString(rawOutput?.specific_issue) || null,
      keywords: safeKeywords(rawOutput?.keywords),
      summary: safeString(rawOutput?.summary),
      confidence: Math.max(0, Math.min(1, Number(rawOutput?.confidence ?? 0))),
      urgency: safeString(rawOutput?.urgency) || null,
      budget_band: safeString(rawOutput?.budget_band) || null,
      preferred_language: safeString(rawOutput?.preferred_language) || null,
    };

    if (output.keywords.length < 3) {
      const fallbackKeywords = [
        output.practice_area,
        output.specific_issue,
        output.urgency,
      ]
        .map((value) => safeString(value))
        .filter(Boolean);
      output.keywords = Array.from(new Set([...output.keywords, ...fallbackKeywords])).slice(0, 3);
    }

    let embedding: number[] | null = null;
    let embeddingModel: string | null = null;
    try {
      const embeddingInput = [
        output?.summary ? `Summary: ${output.summary}` : null,
        output?.practice_area ? `Practice area: ${output.practice_area}` : null,
        output?.specific_issue ? `Specific issue: ${output.specific_issue}` : null,
        output?.keywords?.length ? `Keywords: ${output.keywords.join(", ")}` : null,
        body.description?.trim() ? `Original: ${body.description.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      if (embeddingInput) {
        embeddingModel = "text-embedding-3-small";
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: embeddingModel,
            input: embeddingInput,
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingPayload = await embeddingResponse.json();
          embedding = embeddingPayload?.data?.[0]?.embedding ?? null;
        }
      }
    } catch (embeddingError) {
      console.error("Embedding generation failed:", embeddingError);
    }

    return new Response(JSON.stringify({ output, embedding, embedding_model: embeddingModel }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
