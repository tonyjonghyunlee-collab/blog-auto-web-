import { AI_MODELS } from "./constants";

const _providerStatus = { claude: "ok", gpt: "ok", gemini: "ok" };

export async function callClaude(prompt, model, apiKey) {
  let res;
  try {
    res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: model || "claude-sonnet-4-6", apiKey }),
    });
  } catch (e) { throw new Error(`네트워크 오류 (Claude): ${e.message}`); }
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.text || "";
}

export async function callGPT(prompt, apiKey, model) {
  let res;
  try {
    res = await fetch("/api/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: model || "gpt-5-mini", apiKey }),
    });
  } catch (e) { throw new Error(`네트워크 오류 (GPT): ${e.message}`); }
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.text || "";
}

export async function callGemini(prompt, apiKey, model) {
  let res;
  try {
    res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: model || "gemini-3-flash-preview", apiKey }),
    });
  } catch (e) { throw new Error(`네트워크 오류 (Gemini): ${e.message}`); }
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.text || "";
}

export async function generateGeminiImage(prompt, apiKey, signal, model) {
  const m = model || "gemini-2.0-flash-preview-image-generation";
  let res;
  try {
    res = await fetch("/api/gemini-image", {
      method: "POST", signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: m, apiKey }),
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error(`🌐 네트워크 오류: ${e.message}`);
  }
  const d = await res.json();
  if (d.error) throw new Error(`🔴 ${d.error}`);
  if (!d.image) throw new Error("🖼️ 이미지가 반환되지 않았습니다");
  return d.image;
}

export async function callNaverKeywordAPI(keywords, naverKeys) {
  const res = await fetch("/api/naver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keywords: Array.isArray(keywords) ? keywords : [keywords],
      customerId: naverKeys?.customerId,
      apiKey: naverKeys?.apiKey,
      secretKey: naverKeys?.secretKey,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API ${res.status}`);
  }
  const data = await res.json();
  return (data.keywordList || []).map(k => ({
    keyword: k.relKeyword,
    pc: k.monthlyPcQcCnt === "< 10" ? 5 : parseInt(k.monthlyPcQcCnt) || 0,
    mobile: k.monthlyMobileQcCnt === "< 10" ? 5 : parseInt(k.monthlyMobileQcCnt) || 0,
    total: 0, docs: 0, ratio: 0, score: 0, grade: { l: "-", c: "#64748b" },
  })).map(k => { k.total = k.pc + k.mobile; return k; });
}

export async function callAI(prompt, provider, model, keys) {
  try {
    let result;
    if (provider === "claude") result = await callClaude(prompt, model, keys?.claude);
    else if (provider === "gpt") result = await callGPT(prompt, keys.gpt, model);
    else if (provider === "gemini") result = await callGemini(prompt, keys.gemini, model);
    else return "지원하지 않는 AI입니다";
    _providerStatus[provider] = "ok";
    return result;
  } catch (err) {
    const msg = err.message || "";
    _providerStatus[provider] = "error";
    if (msg.includes("exceeded_limit") || msg.includes("rate_limit") || msg.includes("429")) return `❌ 사용량 한도 초과 (${provider}) — 잠시 후 재시도하세요.`;
    if (msg.includes("invalid_api_key") || msg.includes("401") || msg.includes("Incorrect API")) return `❌ API 키 오류 (${provider}) — .env.local 키를 확인하세요.`;
    if (msg.includes("insufficient_quota") || msg.includes("billing")) return `❌ 잔액 부족 (${provider}) — 결제 설정을 확인하세요.`;
    if (msg.includes("서버에") || msg.includes("설정되지")) return `❌ ${provider} API 키가 서버에 없습니다 — .env.local에 키를 추가하세요.`;
    if (msg.includes("404") || msg.includes("not found")) return `❌ 모델 '${model}' 없음 — 다른 모델을 선택하세요.`;
    return `❌ ${provider} 오류: ${msg.length > 150 ? msg.substring(0, 150) + "..." : msg}`;
  }
}

export function getProviderStatus(provider) {
  if (_providerStatus[provider] === "blocked") return "blocked";
  if (_providerStatus[provider] === "error") return "error";
  return "ok";
}
