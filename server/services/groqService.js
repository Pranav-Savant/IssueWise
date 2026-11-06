import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 15000,
});

export async function generateIssueSummary(title, description) {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "Summarize the software issue in one concise sentence. Preserve the main problem and stated details. Do not invent information or suggest fixes. Return only the summary.",
      },
      {
        role: "user",
        content: `Title: ${title.trim()}\nDescription: ${description.trim()}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 150,
  });

  const summary = completion.choices[0]?.message?.content?.trim();

  if (!summary) {
    console.error(
      "Empty response from Groq:",
      JSON.stringify(completion.choices)
    );

    const error = new Error(
      "The AI provider returned an empty summary."
    );
    error.statusCode = 502;
    throw error;
  }

  return summary;
}
