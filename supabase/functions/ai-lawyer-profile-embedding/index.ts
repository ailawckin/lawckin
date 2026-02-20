import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmbeddingRequest {
  input: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EmbeddingRequest = await req.json();

    if (!body.input || body.input.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Embedding input must be at least 10 characters." }),
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

    const model = "text-embedding-3-small";
    const openAiResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: body.input.trim(),
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return new Response(
        JSON.stringify({ error: "OpenAI embedding request failed", detail: errorText }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const payload = await openAiResponse.json();
    const embedding = payload?.data?.[0]?.embedding ?? null;

    if (!embedding) {
      return new Response(
        JSON.stringify({ error: "Embedding response missing data" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ embedding, embedding_model: model }), {
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
