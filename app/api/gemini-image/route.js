// Gemini 이미지 생성 API 프록시 (BYOK)
export async function POST(request) {
  try {
    const { prompt, model, apiKey: reqKey } = await request.json();
    const apiKey = reqKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "Gemini API 키가 없습니다. ⚙️ 설정에서 입력하세요." }, { status: 400 });
    }

    const m = model || "gemini-2.0-flash-preview-image-generation";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try { const err = await res.json(); detail = err.error?.message || detail; } catch {}
      return Response.json({ error: detail }, { status: res.status });
    }

    const data = await res.json();
    if (data.error) return Response.json({ error: data.error.message }, { status: 400 });
    if (data.promptFeedback?.blockReason) return Response.json({ error: `안전 필터: ${data.promptFeedback.blockReason}` }, { status: 400 });

    const cand = data.candidates?.[0];
    if (!cand) return Response.json({ error: "응답 없음" }, { status: 400 });
    if (cand.finishReason === "SAFETY") return Response.json({ error: "안전 필터 차단" }, { status: 400 });

    const parts = cand.content?.parts || [];
    const imgPart = parts.find((p) => p.inlineData);

    if (!imgPart) {
      const textPart = parts.find((p) => p.text);
      return Response.json({ error: `이미지 없이 텍스트만 반환됨${textPart ? `: ${textPart.text.substring(0, 80)}` : ""}` }, { status: 400 });
    }

    return Response.json({ image: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}` });
  } catch (err) {
    return Response.json({ error: `서버 오류: ${err.message}` }, { status: 500 });
  }
}
