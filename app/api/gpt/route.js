// GPT API 프록시 (BYOK)
export async function POST(request) {
  try {
    const { prompt, model, apiKey: reqKey } = await request.json();
    const apiKey = reqKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "OpenAI API 키가 없습니다. ⚙️ 설정에서 입력하세요." }, { status: 400 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8192,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `GPT API ${res.status}: ${errText.substring(0, 200)}` }, { status: res.status });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: `서버 오류: ${err.message}` }, { status: 500 });
  }
}
