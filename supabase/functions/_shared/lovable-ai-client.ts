/**
 * Lovable AI Gateway Client with Rule-Based Fallback
 * Uses LOVABLE_API_KEY for Lovable AI Gateway, falls back to rule-based system
 */

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIResponse {
  text: string;
  source: "ai" | "rules";
  error?: string;
}

/**
 * Call Lovable AI Gateway
 */
export async function callLovableAI(
  messages: ChatMessage[],
  options: { temperature?: number; jsonMode?: boolean } = {}
): Promise<AIResponse> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  
  if (!apiKey) {
    console.log("LOVABLE_API_KEY not configured, using rule-based fallback");
    return { text: "", source: "rules", error: "API key not configured" };
  }

  try {
    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.5,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lovable AI error (${response.status}):`, errorText);
      
      if (response.status === 429) {
        return { text: "", source: "rules", error: "Rate limit exceeded" };
      }
      if (response.status === 402) {
        return { text: "", source: "rules", error: "Payment required" };
      }
      
      return { text: "", source: "rules", error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    
    if (!text) {
      return { text: "", source: "rules", error: "Empty response" };
    }

    return { text, source: "ai" };
    
  } catch (error) {
    console.error("Lovable AI request failed:", error);
    return { 
      text: "", 
      source: "rules", 
      error: error instanceof Error ? error.message : "Network error" 
    };
  }
}

/**
 * Parse JSON from AI response, handling markdown code blocks
 */
export function parseAIJson<T>(text: string): T | null {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    
    return JSON.parse(cleaned.trim()) as T;
  } catch (e) {
    console.error("Failed to parse AI JSON:", text);
    return null;
  }
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function createErrorResponse(message: string, status: number = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

export function createSuccessResponse(data: unknown, source: "ai" | "rules" = "rules") {
  return new Response(
    JSON.stringify({ ...data as object, _source: source }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
