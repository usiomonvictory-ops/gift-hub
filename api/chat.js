
module.exports = async function handler(req, res) {
  // Allow requests from your website
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests are allowed."
    });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "AI service is not configured."
      });
    }

    const messages = req.body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please provide a message."
      });
    }

    const cleanMessages = messages
      .filter(message =>
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string"
      )
      .slice(-20);

    if (
      cleanMessages.length === 0 ||
      cleanMessages.some(message => message.content.length > 10000)
    ) {
      return res.status(400).json({
        error: "Invalid or excessively long messages."
      });
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "You are USSY AI, a highly capable, friendly and intelligent AI assistant. Answer questions across education, science, technology, programming, business, mathematics, writing, relationships and everyday life. Explain difficult topics in simple language. Provide detailed answers when useful. Be honest if you do not know something. Never pretend to have performed actions you have not performed."
            },
            ...cleanMessages
          ],
          temperature: 0.7,
          max_completion_tokens: 1500
        })
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Groq error:", data);

      return res.status(groqResponse.status).json({
        error: data.error?.message || "The AI service encountered an error."
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    return res.status(200).json({
      reply: reply || "Sorry, I couldn't generate a response."
    });

  } catch (error) {
    console.error("USSY AI error:", error);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
};
