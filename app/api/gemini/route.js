// Gemini API 프록시 (BYOK)
export async function POST(request) {
  try {
    const { prompt, model, apiKey } = await request.json();
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
      return Response.json({ error: "Gemini API 키가 없습니다. ⚙️ 설정에서 입력하세요." }, { status: 400 });
    }

    const m = model || "gemini-3-flash-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Gemini API ${res.status}: ${errText.substring(0, 200)}` }, { status: res.status });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: `서버 오류: ${err.message}` }, { status: 500 });
  }
}
