/**
 * Server-side AI helper — uses ANTHROPIC_API_KEY from environment.
 * No API keys in the client, no localStorage, no user configuration needed.
 */

export async function askAI(prompt: string, maxTokens: number = 200): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("AI is not configured. Contact your administrator.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `AI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}
