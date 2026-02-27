// Claude API 프록시 (BYOK)
export async function POST(request) {
  try {
    const { prompt, model, apiKey: reqKey } = await request.json();
    const apiKey = reqKey || process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "Claude API 키가 없습니다. ⚙️ 설정에서 입력하세요." }, { status: 400 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Claude API ${res.status}: ${errText.substring(0, 200)}` }, { status: res.status });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: `서버 오류: ${err.message}` }, { status: 500 });
  }
}
