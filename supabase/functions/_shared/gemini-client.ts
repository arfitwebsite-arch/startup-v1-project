/**
 * Shared Gemini API Client with Rate Limiting and Retry Logic
 * Uses the user's GEMINI_API_KEY for all requests
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GeminiRequest {
  prompt: string;
  temperature?: number;
  jsonMode?: boolean;
}

interface GeminiResponse {
  text: string;
  error?: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

// Simple in-memory rate limiter state (per function instance)
const rateLimiter = {
  lastRequestTime: 0,
  minIntervalMs: 4000, // ~15 requests per minute = 1 request per 4 seconds
};

/**
 * Wait for rate limit window
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - rateLimiter.lastRequestTime;
  
  if (timeSinceLastRequest < rateLimiter.minIntervalMs) {
    const waitTime = rateLimiter.minIntervalMs - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  rateLimiter.lastRequestTime = Date.now();
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(2, attempt),
    config.maxDelayMs
  );
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Check if error is retryable
 */
function isRetryableError(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Make a request to Gemini API with rate limiting and retry logic
 */
export async function callGemini(
  request: GeminiRequest,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<GeminiResponse> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  
  if (!apiKey) {
    return { text: "", error: "GEMINI_API_KEY is not configured" };
  }

  let lastError: string = "";
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Apply rate limiting
      await waitForRateLimit();
      
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retryConfig.maxRetries}`);
      }

      const requestBody: Record<string, unknown> = {
        contents: [
          {
            role: "user",
            parts: [{ text: request.prompt }],
          },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.5,
        },
      };

      // Add JSON mode if requested
      if (request.jsonMode) {
        (requestBody.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText);
        
        if (response.status === 429) {
          lastError = "Rate limit exceeded";
          
          if (attempt < retryConfig.maxRetries) {
            const delay = getBackoffDelay(attempt, retryConfig);
            console.log(`Rate limited. Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          return { text: "", error: "Rate limits exceeded. Please try again later." };
        }
        
        if (isRetryableError(response.status) && attempt < retryConfig.maxRetries) {
          const delay = getBackoffDelay(attempt, retryConfig);
          console.log(`Retryable error ${response.status}. Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return { text: "", error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (!text) {
        return { text: "", error: "Empty response from API" };
      }

      return { text };
      
    } catch (error) {
      console.error(`Request failed (attempt ${attempt}):`, error);
      lastError = error instanceof Error ? error.message : "Unknown error";
      
      if (attempt < retryConfig.maxRetries) {
        const delay = getBackoffDelay(attempt, retryConfig);
        console.log(`Network error. Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  return { text: "", error: lastError || "Max retries exceeded" };
}

/**
 * Parse JSON response safely
 */
export function parseJsonResponse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
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

export function createSuccessResponse(data: unknown) {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
