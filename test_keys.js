const dotenv = require("dotenv");
dotenv.config();

const openrouterKey = process.env.OPENROUTER_API_KEY;

async function testOpenRouter(model) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openrouterKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });
    console.log(`OpenRouter model: ${model} -> Status: ${res.status}`);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

async function run() {
  await testOpenRouter("google/gemini-2.5-flash");
}
run();
