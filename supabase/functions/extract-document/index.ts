
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !openaiKey) {
      return jsonResponse({ error: "Server configuration is incomplete" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.slice("Bearer ".length);
    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !userData.user) {
      return jsonResponse({ error: "Invalid user session" }, 401);
    }

    const userId = userData.user.id;
    const body = await req.json();
    const storagePath = body.storagePath;

    if (
      typeof storagePath !== "string" ||
      !storagePath.startsWith(`${userId}/`) ||
      storagePath.length > 500
    ) {
      return jsonResponse({ error: "Invalid document path" }, 400);
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from("lifehub-documents")
      .download(storagePath);

    if (downloadError || !file) {
      return jsonResponse({ error: "Could not access the uploaded PDF" }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return jsonResponse({ error: "PDF exceeds the 10 MB limit" }, 413);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Check the PDF file signature.
    if (
      bytes.length < 5 ||
      String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-"
    ) {
      return jsonResponse({ error: "The uploaded file is not a valid PDF" }, 400);
    }

    // Convert the PDF to base64 without exceeding the argument stack.
    let binary = "";
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(
        ...bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
      );
    }

    const base64 = btoa(binary);

    const prompt = `
Read this PDF and extract information for a personal life administration app.

Return ONLY valid JSON with this structure:
{
  "document_type": "string",
  "title": "string",
  "summary": "string",
  "key_dates": [
    {
      "label": "string",
      "date": "YYYY-MM-DD",
      "description": "string"
    }
  ],
  "amounts": [
    {
      "label": "string",
      "value": "string"
    }
  ],
  "suggested_actions": ["string"]
}

Rules:
- Extract only information actually present in the document.
- Never invent dates, amounts, or deadlines.
- Use YYYY-MM-DD for dates when the date is clear.
- If a date is ambiguous, do not include it as a key date.
- Preserve currency symbols and units in amounts.
- Keep the summary concise.
- Suggested actions must be recommendations, not completed actions.
- Return empty arrays when no relevant information is found.
`;

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                filename: "document.pdf",
                file_data: `data:application/pdf;base64,${base64}`,
              },
              {
                type: "input_text",
                text: prompt,
              },
            ],
          },
        ],
        max_output_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error("OpenAI API error:", errorBody);
      return jsonResponse({ error: "AI document extraction failed" }, 502);
    }

    const aiData = await aiResponse.json();

    const outputText = (aiData.output || [])
      .flatMap((item: any) => item.content || [])
      .filter((part: any) => part.type === "output_text")
      .map((part: any) => part.text)
      .join("");

    if (!outputText) {
      return jsonResponse({ error: "AI returned an empty response" }, 502);
    }

    const cleaned = outputText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let extraction;

    try {
      extraction = JSON.parse(cleaned);
    } catch {
      return jsonResponse({ error: "AI returned invalid extraction data" }, 502);
    }

    if (
      !extraction ||
      typeof extraction !== "object" ||
      typeof extraction.title !== "string" ||
      !Array.isArray(extraction.key_dates) ||
      !Array.isArray(extraction.amounts) ||
      !Array.isArray(extraction.suggested_actions)
    ) {
      return jsonResponse({ error: "AI extraction format was invalid" }, 502);
    }

    return jsonResponse({ extraction });
  } catch (error) {
    console.error("Extraction error:", error);
    return jsonResponse({ error: "Unexpected document processing error" }, 500);
  }
});
