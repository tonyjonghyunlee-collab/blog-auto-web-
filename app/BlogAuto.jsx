"use client";
import { useState, useEffect, useRef } from "react";

// ── Environment Detection ──
// Artifact: Claude API proxied (no key needed), external APIs blocked
// Web: All APIs need keys, but all work (no CORS issues)

// ── Config ──
const STEPS = [
  { id: "keywords", label: "키워드", icon: "🔍" },
  { id: "write", label: "글 작성", icon: "✍️" },
  { id: "forbidden", label: "금칙어", icon: "🚫" },
  { id: "images", label: "이미지", icon: "🎨" },
];

const AI_MODELS = {
  claude: {
    name: "Claude", color: "#a78bfa", icon: "🟣", needsKey: true,
    models: [
      { id: "claude-sonnet-4-6", label: "Sonnet 4.6 ★", price: "$3/$15", desc: "최신·Opus급 성능", free: true },
      { id: "claude-opus-4-6", label: "Opus 4.6", price: "$5/$25", desc: "최강 플래그십", free: true },
      { id: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5", price: "$3/$15", desc: "코딩 특화", free: true },
      { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5", price: "$1/$5", desc: "빠르고 저렴", free: true },
      { id: "claude-sonnet-4-20250514", label: "Sonnet 4", price: "$3/$15", desc: "구버전·안정", free: true },
    ],
  },
  gpt: {
    name: "GPT", color: "#74aa9c", icon: "🟢", needsKey: true,
    models: [
      { id: "gpt-5.2", label: "5.2 ★", price: "$1.75/$14", desc: "최신 플래그십" },
      { id: "gpt-5", label: "5", price: "$1.25/$10", desc: "코딩·에이전트" },
      { id: "gpt-5-mini", label: "5 Mini", price: "$0.25/$2", desc: "빠르고 저렴" },
      { id: "gpt-5-nano", label: "5 Nano", price: "$0.05/$0.4", desc: "초저가·분류" },
      { id: "gpt-4.1", label: "4.1", price: "$2/$8", desc: "범용·안정" },
      { id: "gpt-4.1-mini", label: "4.1 Mini", price: "$0.4/$1.6", desc: "소형·가성비" },
      { id: "gpt-4.1-nano", label: "4.1 Nano", price: "$0.1/$0.4", desc: "초소형" },
      { id: "gpt-4o-mini", label: "4o Mini", price: "$0.15/$0.6", desc: "구버전·경량" },
      { id: "gpt-4o", label: "4o", price: "$2.5/$10", desc: "구버전·멀티모달" },
    ],
  },
  gemini: {
    name: "Gemini", color: "#4285f4", icon: "🔵", needsKey: true,
    models: [
      { id: "gemini-2.0-flash", label: "2.0 Flash", price: "$0.1/$0.4", desc: "가성비·안정" },
      { id: "gemini-2.5-flash-lite", label: "2.5 Flash Lite", price: "$0.1/$0.4", desc: "초저가" },
      { id: "gemini-2.5-flash", label: "2.5 Flash", price: "$0.15/$0.6", desc: "사고력+빠름" },
      { id: "gemini-2.5-pro", label: "2.5 Pro", price: "$1.25/$10", desc: "코딩·추론" },
      { id: "gemini-3-flash-preview", label: "3 Flash ⚡", price: "$0.5/$3", desc: "프론티어·빠름" },
      { id: "gemini-3-pro-preview", label: "3 Pro ★", price: "$2/$12", desc: "최고 추론" },
      { id: "gemini-3.1-pro-preview", label: "3.1 Pro ★★", price: "$2/$12", desc: "최신 에이전트" },
    ],
  },
};

const WRITE_STYLES = [
  { id: "clickbait", label: "🎣 낚시형", desc: "호기심 자극, 궁금증 유발, 클릭을 부르는 제목과 도입", color: "#f59e0b",
    prompt: `- 제목은 반드시 클릭하고 싶게 만들어야 합니다. "이것 모르면 손해", "아직도 이렇게 하세요?", "~한 사람만 알고 있는" 같은 호기심 유발 패턴 사용
- 도입부에서 독자가 "이건 나한테 해당되는 이야기다"라고 느끼게 만드세요
- 핵심 정보를 바로 주지 말고 궁금증을 쌓아가며 전개하세요
- 중간중간 "그런데 여기서 중요한 건요..." 같은 전환으로 계속 읽게 유도` },
  { id: "story", label: "📖 스토리텔링", desc: "실제 경험담처럼, 감정 공감, 자연스러운 흐름", color: "#8b5cf6",
    prompt: `- "저도 처음에는 몰랐어요" 같은 1인칭 경험담 스타일로 시작
- 실제 상담 사례나 주변 이야기를 활용 (가상이어도 현실적으로)
- 감정의 흐름: 걱정 → 알아봄 → 해결 → 안심 구조
- 독자가 자기 이야기처럼 느끼게 공감 포인트를 잡아주세요` },
  { id: "info", label: "📊 정보전달", desc: "체계적 분석, 객관적 비교, 전문가 톤", color: "#3b82f6",
    prompt: `- 객관적이고 신뢰감 있는 전문가 톤
- 구체적인 수치, 비교표, 조건 등을 활용
- "첫째, 둘째" 같은 구조적 전개
- 독자가 "이 글 하나로 다 이해했다"고 느끼게 정리` },
  { id: "compare", label: "⚖️ 비교분석", desc: "A vs B 구조, 장단점, 어떤 게 나에게 맞는지", color: "#ec4899",
    prompt: `- "A와 B, 뭐가 다를까?" 같은 비교 구조로 시작
- 각각의 장점과 단점을 공정하게 비교
- "이런 분은 A가 좋고, 저런 분은 B가 좋습니다" 결론
- 표나 정리 형식으로 한눈에 비교할 수 있게` },
  { id: "problem", label: "🔧 문제해결", desc: "고민 제시 → 원인 → 해결법, 실용 팁 중심", color: "#10b981",
    prompt: `- "혹시 이런 고민 있으신가요?" 로 시작해서 독자의 문제를 정확히 짚기
- 왜 이 문제가 생기는지 원인 설명
- 구체적이고 실행 가능한 해결 방법 제시
- "지금 당장 이것부터 하세요" 같은 액션 아이템 포함` },
  { id: "listicle", label: "📋 리스트형", desc: "5가지 방법, 3가지 이유 등 숫자 기반 구성", color: "#f97316",
    prompt: `- 제목에 숫자를 넣으세요: "반드시 알아야 할 5가지", "3가지 이유"
- 각 항목을 명확하게 구분하여 소제목으로 정리
- 각 항목마다 짧고 핵심적인 설명
- 마지막 항목을 가장 강력한 내용으로 배치 (클라이맥스)` },
];

const PERSONAS = [
  { id: "experience", label: "👤 경험자", desc: "직접 겪은 사람의 후기", prompt: "나는 이 주제를 직접 경험한 사람입니다. 1인칭 시점으로, 처음 알아볼 때의 막막함 → 비교 과정 → 최종 선택 → 결과까지 실제 경험담처럼 생생하게 써주세요. '처음에는 뭘 봐야 할지 몰랐는데...'처럼 시작하세요." },
  { id: "expert", label: "🎓 전문가", desc: "업계 종사자의 분석", prompt: "나는 이 분야에서 10년 이상 근무한 전문가입니다. 업계 내부자만 아는 정보, 흔한 실수, 숨겨진 팁을 공유하는 톤으로 써주세요. '업계에서 일하다 보면...'처럼 자연스럽게 전문성을 드러내세요." },
  { id: "parent", label: "👨‍👩‍👦 부모/가족", desc: "가족을 위해 알아보는 관점", prompt: "나는 부모님이나 가족을 위해 이 주제를 알아보는 사람입니다. 걱정과 사랑이 담긴 톤으로, '부모님이 걱정되어서 이것저것 알아봤는데...'처럼 감정적 공감을 이끌어내세요." },
  { id: "beginner", label: "🌱 초보자", desc: "처음 알아보는 사람의 시선", prompt: "나는 이 주제에 대해 아무것도 모르는 초보자입니다. 어려운 용어를 쉽게 풀어주고, '저처럼 처음이신 분들은...'이라는 톤으로 함께 배워가는 느낌으로 써주세요." },
  { id: "none", label: "📝 중립", desc: "페르소나 없이 객관적 서술", prompt: "" },
];

const HOOKS = [
  { id: "question", label: "❓ 질문형", desc: "궁금증 유발", prompt: "도입부를 강렬한 질문으로 시작하세요. 독자가 '나도 궁금했어!'라고 느끼는 질문이어야 합니다. 예: '혹시 ~한 경험 있으신가요?', '왜 ~일까요?'" },
  { id: "shock", label: "⚡ 반전형", desc: "예상 깨는 사실", prompt: "도입부에 독자의 상식을 깨는 놀라운 사실이나 통계로 시작하세요. 예: '사실 ~의 70%는 ~라는 걸 아시나요?', '대부분 ~라고 생각하지만, 실제로는...'" },
  { id: "empathy", label: "🤝 공감형", desc: "독자의 고민에 공감", prompt: "도입부에서 독자의 현재 고민이나 상황을 정확히 짚어주세요. 예: '요즘 ~때문에 고민이 많으시죠?', '저도 처음에 ~할 때 정말 막막했어요'" },
  { id: "story", label: "📖 이야기형", desc: "에피소드로 시작", prompt: "도입부를 짧은 에피소드나 상황 묘사로 시작하세요. 예: '지난달, ~을 하다가 깜짝 놀란 일이 있었어요', '어느 날 갑자기 ~한 전화를 받았는데...'" },
  { id: "none", label: "✍️ 자유", desc: "AI 자율 결정", prompt: "" },
];

// ── Utils ──
function scoreKw(total, docs) {
  const ts = Math.max(0, 50 - Math.abs(total - 700) / 10);
  const rs = Math.max(0, 50 - (docs / Math.max(total, 1)) / 10);
  return Math.round((total < 300 || total > 1000 ? ts * 0.3 + rs : ts + rs) * 10) / 10;
}
function grade(s) {
  if (s >= 70) return { l: "★★★", c: "#22c55e" };
  if (s >= 50) return { l: "★★", c: "#eab308" };
  if (s >= 30) return { l: "★", c: "#f97316" };
  return { l: "☆", c: "#64748b" };
}
async function load(k, fb) { try { if (typeof window === "undefined") return fb; const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } }
async function save(k, d) { try { if (typeof window === "undefined") return; localStorage.setItem(k, JSON.stringify(d)); } catch {} }

// ── AI API Calls ──
async function callClaude(prompt, model, apiKey) {
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

async function callGPT(prompt, apiKey, model) {
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

async function callGemini(prompt, apiKey, model) {
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

async function generateGeminiImage(prompt, apiKey, signal, model) {
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

const IMG_STYLES = [
  { id: "general", label: "🖼️ 일반", prompt: "Clean, professional blog illustration, soft colors, modern design" },
  { id: "table", label: "📊 표/설명형", prompt: "Infographic style with visual data representation, no text, icons and diagrams" },
  { id: "compare", label: "⚖️ 비교형", prompt: "Split comparison layout, two sides showing different options, visual contrast" },
  { id: "process", label: "🔄 프로세스", prompt: "Step by step process flow, visual journey, numbered icons without text" },
  { id: "person", label: "👤 인물/감성", prompt: "Warm emotional scene, person in everyday life situation, cozy atmosphere" },
  { id: "icon", label: "🎯 아이콘형", prompt: "Flat design icon illustration, minimalist, single concept, vibrant colors" },
  { id: "photo", label: "📷 사진풍", prompt: "Photorealistic, high quality stock photo style, natural lighting" },
  { id: "hand", label: "✏️ 손그림풍", prompt: "Hand-drawn sketch style, warm pencil illustration, friendly casual feel" },
];

const GEMINI_IMG_MODELS = [
  { id: "gemini-2.0-flash-preview-image-generation", label: "2.0 Flash 이미지", desc: "안정적·구버전", price: "$0.039/장", priceKr: "≈₩57", speed: "⚡빠름" },
  { id: "gemini-2.5-flash-image", label: "Nano Banana 🍌", desc: "네이티브 이미지·추천", price: "$0.039/장", priceKr: "≈₩57", speed: "⚡빠름" },
  { id: "gemini-3-pro-image-preview", label: "Nano Banana Pro 🍌★", desc: "4K·최고화질", price: "~$0.07/장", priceKr: "≈₩100", speed: "🐢느림" },
];

// ── Naver Search Ad API ──
// naverSignature moved to server (/api/naver)

async function callNaverKeywordAPI(keywords, naverKeys) {
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
  })).map(k => {
    k.total = k.pc + k.mobile;
    return k;
  });
}

// Track which providers actually work in this environment
const _providerStatus = { claude: "ok", gpt: "ok", gemini: "ok" }; // Web: all available via proxy

async function callAI(prompt, provider, model, keys) {
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

function getProviderStatus(provider, apiKeys) {
  // Web version: all providers available via server proxy
  // Server will return proper error if key is missing
  if (_providerStatus[provider] === "blocked") return "blocked";
  if (_providerStatus[provider] === "error") return "error";
  return "ok";
}

// ── Main App ──
export default function App() {
  const [step, setStep] = useState("keywords");
  const [showSettings, setShowSettings] = useState(false);

  // AI settings — per step
  const defaultStepAI = { write: { provider: "gemini", model: "gemini-3-flash-preview" }, forbidden: { provider: "gemini", model: "gemini-3-flash-preview" }, images: { provider: "gemini", model: "gemini-3-flash-preview" } };
  const [stepAI, setStepAI] = useState(defaultStepAI);
  const [apiKeys, setApiKeys] = useState({ claude: "", gpt: "", gemini: "" });
  const [naverKeys, setNaverKeys] = useState({ customerId: "", apiKey: "", secretKey: "" });
  const [showKeys, setShowKeys] = useState({ claude: false, gpt: false, gemini: false, naver: false });
  const [naverStatus, setNaverStatus] = useState(""); // "", "ok", "error:msg"

  // Keywords
  const [keywords, setKeywords] = useState([]);
  const [selectedKw, setSelectedKw] = useState(null);
  const [bulkText, setBulkText] = useState("");
  const [relatedKws, setRelatedKws] = useState([]);
  const [seedKw, setSeedKw] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(-1);

  // Briefing & Style
  const [briefing, setBriefing] = useState("");
  const [writeStyle, setWriteStyle] = useState("clickbait");
  const [persona, setPersona] = useState("experience");
  const [hookStyle, setHookStyle] = useState("question");

  // Writing
  const [manualKw, setManualKw] = useState("");
  const [subKw, setSubKw] = useState("");
  const [topic, setTopic] = useState("");
  const [contact, setContact] = useState("");
  const [target, setTarget] = useState("40-60대 보험에 관심 있는 분");
  const [blog, setBlog] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [titleCandidates, setTitleCandidates] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Forbidden
  const [forbidden, setForbidden] = useState([]);
  const [detected, setDetected] = useState([]);
  const [fixedBlog, setFixedBlog] = useState("");
  const [checkText, setCheckText] = useState("");
  const [fwPasteText, setFwPasteText] = useState("");
  const [fwParsed, setFwParsed] = useState([]);
  const [aiAttempts, setAiAttempts] = useState(0);
  const [newFw, setNewFw] = useState("");
  const [newReplace, setNewReplace] = useState("");

  // Images
  const [imgSlots, setImgSlots] = useState([]);
  const [defaultImgStyle, setDefaultImgStyle] = useState("general");
  const [imgExtraNotes, setImgExtraNotes] = useState("");
  const [preSlotCount, setPreSlotCount] = useState(3);
  const [preSlotStyles, setPreSlotStyles] = useState(["general", "compare", "process"]);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState("");
  const abortRef = useRef(null);

  // ── Storage ──
  useEffect(() => {
    (async () => {
      // Reset old settings if migrating from artifact to web
      const ver = await load("nv-version", 0);
      if (ver < 3) {
        await save("nv-stepai", null); // force new defaults
        await save("nv-version", 3);
      }
      setForbidden(await load("nv-fw", []));
      setContact(await load("nv-ct", ""));
      setTarget(await load("nv-tg", "40-60대 보험에 관심 있는 분"));
      setBriefing(await load("nv-brief", ""));
      setWriteStyle(await load("nv-style", "clickbait"));
      setHistory(await load("nv-history", []));
      const k = await load("nv-keys", { claude: "", gpt: "", gemini: "" });
      setApiKeys(k);
      const nk = await load("nv-naver", { customerId: "", apiKey: "", secretKey: "" });
      setNaverKeys(nk);
      const sai = await load("nv-stepai", defaultStepAI);
      // Web version: if saved settings use claude but we might not have claude key, use defaults
      const merged = { ...defaultStepAI };
      for (const key of Object.keys(sai)) {
        if (sai[key]?.provider && AI_MODELS[sai[key].provider]) {
          merged[key] = sai[key];
        }
      }
      setStepAI(merged);
    })();
  }, []);

  useEffect(() => { if (forbidden.length) save("nv-fw", forbidden); }, [forbidden]);
  useEffect(() => { if (contact) save("nv-ct", contact); }, [contact]);
  useEffect(() => { save("nv-brief", briefing); }, [briefing]);
  useEffect(() => { save("nv-style", writeStyle); }, [writeStyle]);
  useEffect(() => { save("nv-keys", apiKeys); }, [apiKeys]);
  useEffect(() => { save("nv-naver", naverKeys); }, [naverKeys]);
  useEffect(() => { save("nv-stepai", stepAI); }, [stepAI]);

  // Per-step AI helpers
  const setStepProvider = (stepId, provider) => {
    const model = AI_MODELS[provider].models[0].id;
    setStepAI(prev => ({ ...prev, [stepId]: { provider, model } }));
  };
  const setStepModel = (stepId, model) => {
    setStepAI(prev => ({ ...prev, [stepId]: { ...prev[stepId], model } }));
  };
  const aiFor = (stepId) => {
    const s = stepAI[stepId] || stepAI.write;
    return { provider: s.provider, model: s.model, info: AI_MODELS[s.provider] };
  };
  const callFor = (stepId, prompt) => {
    const s = stepAI[stepId] || stepAI.write;
    return callAI(prompt, s.provider, s.model, apiKeys);
  };
  const isAvailable = (provider) => {
    const st = getProviderStatus(provider, apiKeys);
    return st === "ok" || st === "unknown";
  };
  const statusOf = (provider) => getProviderStatus(provider, apiKeys);
  // Current step AI (for header display)
  const currentStepAI = aiFor(step === "keywords" ? "write" : step === "forbidden" ? "forbidden" : step === "images" ? "images" : "write");

  // Reusable AI picker inline component
  const AIPicker = ({ stepId }) => {
    const s = stepAI[stepId] || stepAI.write;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
        {Object.entries(AI_MODELS).map(([key, val]) => {
          const st = statusOf(key);
          const active = s.provider === key;
          const statusColor = st === "ok" ? "#22c55e" : st === "blocked" ? "#ef4444" : st === "nokey" ? "#f59e0b" : "#64748b";
          const statusLabel = st === "ok" ? "" : st === "blocked" ? " (차단)" : st === "nokey" ? " (키❌)" : "";
          return (
            <button key={key} onClick={() => setStepProvider(stepId, key)} title={
              st === "blocked" ? `${val.name}: 네트워크 오류` :
              st === "nokey" ? `${val.name}: API 키를 설정에서 입력하세요` :
              st === "ok" ? `${val.name}: 정상 연결` : `${val.name}: 미확인`
            } style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14,
              border: `1.5px solid ${active ? val.color : "rgba(0,0,0,0.1)"}`,
              background: active ? `${val.color}15` : "transparent", cursor: "pointer", transition: "all 0.15s",
              opacity: st === "blocked" ? 0.5 : 1,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? val.color : "#64748b" }}>{val.icon} {val.name}{statusLabel}</span>
            </button>
          );
        })}
        <select value={s.model} onChange={e => setStepModel(stepId, e.target.value)} style={{ ...inp, padding: "3px 6px", fontSize: 11, width: "auto", minWidth: 130, margin: 0, cursor: "pointer" }}>
          {AI_MODELS[s.provider].models.map(m => <option key={m.id} value={m.id}>{m.label} ({m.price}/M) {m.desc}</option>)}
        </select>
      </div>
    );
  };

  const stopAI = () => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setLoading("");
  };

  // ── Keyword funcs ──
  const parseBulk = (text) => {
    const results = [];
    for (const line of text.trim().split("\n").filter(Boolean)) {
      const p = line.split(/[\t,]+/).map(s => s.trim()).filter(Boolean);
      if (p.length >= 4) {
        const n = s => parseInt((s || "0").replace(/,/g, "")) || 0;
        const kw = p[0], pc = n(p[1]), mob = n(p[2]), tot = n(p[3]) || pc + mob, docs = n(p[4]);
        const ratio = parseFloat((p[5] || "0").replace(/,/g, "")) || Math.round(docs / Math.max(tot, 1) * 10) / 10;
        const sc = scoreKw(tot, docs);
        results.push({ keyword: kw, pc, mobile: mob, total: tot, docs, ratio, score: sc, grade: grade(sc) });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  };

  const handlePaste = () => {
    const parsed = parseBulk(bulkText);
    if (parsed.length) {
      setKeywords(prev => {
        const existing = new Set(prev.map(k => k.keyword));
        return [...prev, ...parsed.filter(p => !existing.has(p.keyword))].sort((a, b) => b.score - a.score);
      });
      setBulkText("");
    }
  };

  const generateRelated = async () => {
    if (!seedKw.trim()) return;
    setLoading("연관 키워드 생성 중...");
    const result = await callFor("write", `너는 네이버 SEO 키워드 전문가야. "${seedKw}"와 관련된 검색 키워드를 생성해.

## 핵심 원칙: 짧은 키워드 우선
- 검색어가 길수록 검색량이 줄고 키워드 가치가 떨어짐
- 25개 이상은 반드시 1~3단어 이내 짧은 키워드로 생성
- 한 단어 키워드를 최대한 많이 포함 (예: 실손, 치매, 간병, 암보험, 연금 등)

## 규칙
- "${seedKw}"에 단어를 덧붙이는 것(예: "${seedKw} 추천")은 최대 5개만
- 나머지 25개는 완전히 다른 짧은 단어/표현
- 총 30개

## 좋은 예시 ("노인보험"이 입력인 경우)
- 변형 5개: 노인보험 추천, 노인보험 비교, 노인보험 가입나이, 노인보험 보장, 노인보험료
- 짧은 키워드 25개: 실손보험, 치매보험, 간병보험, 암보험, 효도보험, 시니어보험, 건강보험, 의료실비, 갱신형실비, 종합보험, 정기보험, 종신보험, 입원비, 수술비, 통원비, 장기요양, 노후준비, 은퇴설계, 연금보험, 상해보험, 질병보험, 60대보험, 70대보험, 부모보험, 가족보험

## 나쁜 예시 (금지)
- "노인보험 종류", "노인보험 필요성" ← 전부 "노인보험+α" 패턴
- "노인을 위한 종합 건강보장 보험" ← 너무 긴 문장형 키워드

형식: 한 줄에 키워드 하나만, 번호나 설명 없이 키워드만 출력. 총 30개.`);
    const kResult = result.replace(/^⚠️[^\n]*\n*/i, "");
    const parsed = kResult.split("\n").map(s => s.replace(/^[\d\.\-\*\s]+/, "").trim()).filter(s => s.length > 1 && s.length < 30);
    // Always include the seed keyword itself at the top
    const seed = seedKw.trim();
    const withSeed = parsed.includes(seed) ? parsed : [seed, ...parsed];
    setRelatedKws(withSeed);
    setLoading("");
    // Auto-trigger Naver API search if keys are available
    if (naverHasKeys && withSeed.length > 0) {
      setTimeout(() => autoSearchNaver(withSeed), 300);
    }
  };

  const copyKw = (kw, i) => { copyText(kw); setCopiedIdx(i); setTimeout(() => setCopiedIdx(-1), 1000); };

  // Sub keyword suggestions with search volume data
  const [subSuggestions, setSubSuggestions] = useState([]); // [{keyword, total, score}]

  const autoSuggestSubKw = (mainKw) => {
    // Use keywords with search volume data (from Naver API or manual paste)
    const mainKwLower = (mainKw || "").toLowerCase();
    const candidates = keywords
      .filter(k => k.keyword.toLowerCase() !== mainKwLower)
      .filter(k => k.total > 0);

    if (candidates.length > 0) {
      // Sort by proximity to ideal range (600-700)
      const idealTarget = 650;
      const sorted = [...candidates].sort((a, b) => {
        const diffA = Math.abs(a.total - idealTarget);
        const diffB = Math.abs(b.total - idealTarget);
        return diffA - diffB;
      });
      const top = sorted.slice(0, 8);
      setSubSuggestions(top);
      if (!subKw.trim()) {
        setSubKw(top.slice(0, 5).map(k => k.keyword).join(", "));
      }
    } else if (relatedKws.length > 0) {
      // Fallback: use related keywords without volume data
      const suggestions = relatedKws
        .filter(kw => kw.toLowerCase() !== mainKwLower && kw !== seedKw.trim())
        .filter(kw => kw.length <= 8)
        .slice(0, 5);
      setSubSuggestions(suggestions.map(kw => ({ keyword: kw, total: 0, score: 0 })));
      if (!subKw.trim()) setSubKw(suggestions.join(", "));
    }
  };

  // ── Naver API auto-search ──
  const naverHasKeys = !!(naverKeys.customerId && naverKeys.apiKey && naverKeys.secretKey);

  const autoSearchNaver = async (kwList) => {
    if (!naverHasKeys) { setNaverStatus("nokeys"); return; }
    setLoading("네이버 API 검색량 조회 중...");
    setNaverStatus("");
    try {
      // Naver API accepts max 5 keywords per call
      const batches = [];
      for (let i = 0; i < kwList.length; i += 5) batches.push(kwList.slice(i, i + 5));
      const allResults = [];
      for (const batch of batches) {
        const results = await callNaverKeywordAPI(batch, naverKeys);
        allResults.push(...results);
      }
      // Naver API gives search volume but not document count. Score based on volume only.
      const scored = allResults.map(k => {
        const sc = scoreKw(k.total, 0); // No doc count from Naver API
        return { ...k, score: sc, grade: grade(sc) };
      });
      setKeywords(prev => {
        const existing = new Set(prev.map(k => k.keyword));
        return [...prev, ...scored.filter(k => !existing.has(k.keyword))].sort((a, b) => b.score - a.score);
      });
      setNaverStatus("ok");
    } catch (err) {
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setNaverStatus("error:서버 연결 실패 — localhost:3000이 실행 중인지 확인하세요");
      } else if (err.message.includes("CORS")) {
        setNaverStatus("error:CORS 오류 — 서버 프록시를 통해 호출되어야 합니다");
      } else {
        setNaverStatus("error:" + err.message);
      }
    }
    setLoading("");
  };

  const autoSearchAll = async () => {
    const kwList = relatedKws.length > 0 ? relatedKws : seedKw ? [seedKw] : [];
    if (!kwList.length) return;
    await autoSearchNaver(kwList);
  };

  // ── Forbidden funcs ──
  // Context-aware phrase replacements (금칙어 + 앞뒤 조사/어미)
  const PHRASE_REPLACE = {
    "가입하": "준비하", "가입을": "준비를", "가입이": "준비가", "가입할": "준비할",
    "가입한": "준비한", "가입해": "준비해", "가입에": "준비에", "가입도": "준비도",
    "가입 시": "준비 시", "가입하세요": "준비하시기 바랍니다", "가입하셔": "준비하셔",
    "상담을": "문의를", "상담이": "문의가", "상담 후": "문의 후", "상담해": "문의해",
    "상담받": "문의받", "상담을 받": "문의를 하", "상담하": "문의하",
    "전화를": "연락을", "전화로": "연락으로", "전화해": "연락해", "전화 주": "연락 주",
    "하세요": "하시기 바랍니다", "보세요": "보시기 바랍니다", "주세요": "주시기 바랍니다",
    "드세요": "드시기 바랍니다", "으세요": "으시기 바랍니다",
    "하시면": "하시게 되면", "하시는": "하시려는", "하시기": "하시려",
    "야 합니다": "어야 합니다", "야 해요": "어야 해요", "야 할": "어야 할",
    "고민이": "걱정이", "고민을": "걱정을", "고민하": "걱정하", "고민되": "걱정되",
    "시기에": "시점에", "시기를": "시점을", "시기가": "시점이",
    "확인하세요": "확인하시기 바랍니다", "알아보세요": "알아보시기 바랍니다",
    "비하": "대비하", "대비하하": "대비하",
  };

  // Simple word-level fallback
  const COMMON_REPLACE = {
    "가입": "준비", "세요": "습니다", "상담": "문의",
    "하시": "하여", "전화": "연락", "고민": "걱정", "시기": "시점", "각하": "줄이",
    "무료": "부담 없는", "추천": "안내", "비교": "살펴보기", "견적": "예상 금액",
    "보장": "지원 범위", "해약": "중도 해지", "보험료": "월 납입금", "보험금": "지급금",
    "약관": "계약 내용", "야 하": "어야 하", "드립니다": "겠습니다", "드려요": "겠습니다",
    "해드": "도와", "진행": "안내", "혜택": "장점", "비하": "대비하",
  };

  const addFw = (w, r = "", img = false) => {
    if (!w.trim() || forbidden.find(f => f.word === w.trim())) return;
    const autoR = r.trim() || COMMON_REPLACE[w.trim()] || "";
    setForbidden(p => [...p, { word: w.trim(), replacement: autoR, isImageOnly: img }]);
  };
  const removeFw = (w) => setForbidden(p => p.filter(f => f.word !== w));
  const updateFwR = (w, r) => setForbidden(p => p.map(f => f.word === w ? { ...f, replacement: r } : f));
  const toggleFwImg = (w) => setForbidden(p => p.map(f => f.word === w ? { ...f, isImageOnly: !f.isImageOnly } : f));

  const suggestAllReplacements = () => {
    setForbidden(prev => prev.map(f => {
      if (!f.replacement && !f.isImageOnly && COMMON_REPLACE[f.word]) {
        return { ...f, replacement: COMMON_REPLACE[f.word] };
      }
      return f;
    }));
  };

  const copyText = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
  };

  const checkForbidden = (textToCheck) => {
    const t = textToCheck || checkText || blog;
    if (!t) return 0;
    setAiAttempts(0);
    // Detect
    const found = [];
    for (const fw of forbidden) {
      const m = t.match(new RegExp(fw.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
      if (m) found.push({ ...fw, count: m.length });
    }
    setDetected(found.sort((a, b) => b.count - a.count));

    // 1차: 문맥 기반 구문 치환 (긴 것부터)
    let fixed = t;
    const phraseKeys = Object.keys(PHRASE_REPLACE).sort((a, b) => b.length - a.length);
    for (const phrase of phraseKeys) {
      fixed = fixed.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), PHRASE_REPLACE[phrase]);
    }

    // 2차: 단순 단어 치환 (남은 것만)
    const sortedFw = [...forbidden].filter(f => f.replacement && !f.isImageOnly).sort((a, b) => b.word.length - a.word.length);
    for (const fw of sortedFw) {
      fixed = fixed.replace(new RegExp(fw.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), fw.replacement);
    }

    // 3차: 치환 후 생긴 이중 표현 정리 ("대비하하" → "대비하" 등)
    fixed = fixed.replace(/(.)\1{2,}/g, "$1$1"); // 3연속 같은 글자 제거
    fixed = fixed.replace(/준비하시기 바랍니다시기/g, "준비하시기"); // 부작용 정리
    
    setFixedBlog(fixed);

    // Count remaining
    let remaining = 0;
    for (const fw of forbidden) {
      const m2 = fixed.match(new RegExp(fw.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
      if (m2) remaining += m2.length;
    }
    return remaining;
  };

  // ── Title parsing ──
  const parseTitles = (text) => {
    const titles = [];
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      const m = trimmed.match(/^(?:제목\s*(?:후보)?\s*)?(?:\d+[\.\)\:]|[①②③④⑤]|[-•])\s*(.+)/);
      if (m && m[1]) {
        const t = m[1].replace(/^[\s:：]+/, "").replace(/["""]/g, "").trim();
        if (t.length > 5 && t.length < 80 && !t.includes("본문") && !t.includes("태그")) titles.push(t);
      }
    }
    return titles.slice(0, 5);
  };

  const stripTitleSection = (text, titles) => {
    // Remove title candidate lines from the blog body
    let lines = text.split("\n");
    let startIdx = -1, endIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      // Detect title section header or first title line
      if (t.match(/^(?:제목\s*(?:후보)?|##?\s*제목)/i) || (startIdx === -1 && titles.some(title => t.includes(title)))) {
        if (startIdx === -1) startIdx = i;
      }
      if (startIdx >= 0 && titles.some(title => t.includes(title))) {
        endIdx = i;
      }
    }
    if (startIdx >= 0 && endIdx >= 0) {
      // Remove from startIdx to endIdx+1 (plus any blank lines after)
      let cutEnd = endIdx + 1;
      while (cutEnd < lines.length && lines[cutEnd].trim() === "") cutEnd++;
      lines.splice(startIdx, cutEnd - startIdx);
    }
    // Also remove any leading blank lines
    while (lines.length && lines[0].trim() === "") lines.shift();
    return lines.join("\n");
  };

  // ── Forbidden word paste parser ──
  const parseFwPaste = (text) => {
    const results = [];
    const clean = text.trim();
    if (!clean) return results;

    const lines = clean.split("\n").filter(l => l.trim());

    // Multi-line table: "가입\t7\n세요\t5\n..."
    if (lines.length > 1) {
      for (const line of lines) {
        const parts = line.split(/\t+/);
        if (parts.length >= 2) {
          const word = parts[0].trim();
          const count = parseInt(parts[1]);
          if (word && !isNaN(count) && word !== "금칙어") {
            results.push({ word, count });
          }
        }
      }
      if (results.length > 0) return results;
    }

    // Single-line formats: "고민\t4 각하\t1 각 하\t1 야 할\t1"
    // or "고민4 각하1 각 하1" or "고민×4 각하×1"

    // Strategy: split by tab first, then parse each chunk as "word count" pairs
    // Handle inline tab pairs: word\tcount word\tcount...
    if (clean.includes("\t")) {
      const tabParts = clean.split("\t");
      // Tab pairs: [word1, "count1 word2", "count2 word3", ...]
      for (let i = 0; i < tabParts.length; i++) {
        const part = tabParts[i].trim();
        if (!part) continue;
        // Check if this part starts with a number (it's "count prevWord nextWord")
        const numMatch = part.match(/^(\d+)\s*(.*)/);
        if (numMatch && results.length > 0) {
          // The number is the count for the previous word
          results[results.length - 1].count = parseInt(numMatch[1]);
          // Remaining text is the next word
          const nextWord = numMatch[2].trim();
          if (nextWord && /[가-힣]/.test(nextWord)) {
            results.push({ word: nextWord, count: 1 });
          }
        } else if (/[가-힣]/.test(part)) {
          // This is a word (possibly with count embedded)
          const embedded = part.match(/^([가-힣][가-힣\s]*?)(\d+)$/);
          if (embedded) {
            results.push({ word: embedded[1].trim(), count: parseInt(embedded[2]) });
          } else {
            results.push({ word: part, count: 1 });
          }
        }
      }
      if (results.length > 0) return results.filter(r => r.word && r.word !== "금칙어");
    }

    // Fallback: regex for "word + number" patterns (handles concatenated format)
    // "금칙어건수가입7세요5상담3야 하1"
    const stripped = clean.replace(/^금칙어\s*건수/, "").replace(/[×x]/gi, "");
    const matches = [...stripped.matchAll(/([가-힣](?:[가-힣\s]*[가-힣])?)[\s]*(\d+)/g)];
    for (const m of matches) {
      const word = m[1].trim();
      const count = parseInt(m[2]);
      if (word && word !== "금칙어") results.push({ word, count });
    }

    // Also catch trailing words without a count (assume count 1)
    if (results.length > 0) {
      const lastMatch = matches[matches.length - 1];
      if (lastMatch) {
        const afterLast = stripped.substring(lastMatch.index + lastMatch[0].length).trim();
        if (afterLast && /^[가-힣]/.test(afterLast)) {
          const trailingWord = afterLast.match(/^([가-힣][가-힣\s]*)/);
          if (trailingWord) results.push({ word: trailingWord[1].trim(), count: 1 });
        }
      }
    }

    return results;
  };

  // ── History ──
  const saveToHistory = (title, body) => {
    const entry = {
      id: Date.now(),
      title: title || "제목 없음",
      body,
      fixedBody: "",
      keyword: selectedKw?.keyword || manualKw || "",
      style: writeStyle,
      date: new Date().toLocaleDateString("ko-KR"),
      updated: "",
    };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 30);
      save("nv-history", next);
      return next;
    });
  };

  const updateHistory = (updatedBody) => {
    // Find most recent matching entry by title
    const target = history.find(h => h.title === blogTitle) || history[0];
    if (!target) return;
    setHistory(prev => {
      const next = prev.map(h => h.id === target.id ? {
        ...h,
        fixedBody: updatedBody,
        updated: new Date().toLocaleString("ko-KR"),
      } : h);
      save("nv-history", next);
      return next;
    });
  };

  const loadFromHistory = (entry) => {
    setBlogTitle(entry.title);
    // Load fixedBody if available, otherwise original
    const bestBody = entry.fixedBody || entry.body;
    setBlog(bestBody);
    setFixedBlog("");
    setCheckText("");
    setDetected([]);
    if (entry.keyword) setManualKw(entry.keyword);
    if (entry.style) setWriteStyle(entry.style);
    setShowHistory(false);
  };

  const deleteHistory = (id) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      save("nv-history", next);
      return next;
    });
  };

  // ── Generation ──
  const buildFwPrompt = () => {
    if (!forbidden.length) return "";
    const textFw = forbidden.filter(f => !f.isImageOnly);
    const imgFw = forbidden.filter(f => f.isImageOnly);
    let section = "\n\n## ⚠️ 금칙어 규칙 (반드시 준수)";
    section += "\n아래 단어들은 네이버 블로그 저품질/제재 대상입니다. 절대 사용하지 마세요.";
    section += "\n글자를 쪼개거나 비슷한 발음으로 바꾸는 것도 안 됩니다.";
    section += "\n대신 의미가 통하는 다른 표현으로 우회하세요.\n";
    if (textFw.length) {
      section += "\n### 텍스트 금칙어 (다른 표현으로 우회):";
      for (const f of textFw) {
        if (f.replacement) {
          section += `\n- "${f.word}" → "${f.replacement}" 사용`;
        } else {
          section += `\n- "${f.word}" → 자연스러운 다른 표현 사용`;
        }
      }
    }
    if (imgFw.length) {
      section += "\n\n### 이미지 전용 금칙어 (텍스트 사용 금지, 이미지로만 표현):";
      section += "\n이 단어들이 들어갈 자리에 [이미지: 설명]을 넣으세요.";
      for (const f of imgFw) {
        section += `\n- "${f.word}" → [이미지: ${f.word} 관련 시각 자료]`;
      }
    }
    section += "\n\n※ 금칙어가 제목에 들어가면 안 됩니다!";
    section += "\n※ 우회 예시: \"가입\" → \"준비\"/\"신청\"/\"알아보기\", \"상담\" → \"문의\"/\"안내 받기\", \"세요\" → \"~합니다\"/\"~입니다\"";
    return section;
  };

  const generateBlog = async () => {
    const mainKeyword = selectedKw?.keyword || manualKw.trim();
    if (!mainKeyword || !topic) return;
    setLoading("블로그 글 작성 중...");
    const fwSection = buildFwPrompt();
    const style = WRITE_STYLES.find(s => s.id === writeStyle);
    const personaObj = PERSONAS.find(p => p.id === persona);
    const hookObj = HOOKS.find(h => h.id === hookStyle);
    const briefingSection = briefing.trim() ? `\n\n## 반드시 포함할 핵심 내용 (이 내용을 중심으로 글을 구성하세요)\n${briefing}` : "";
    const personaSection = personaObj?.prompt ? `\n\n## 글쓴이 페르소나\n${personaObj.prompt}` : "";
    const hookSection = hookObj?.prompt ? `\n\n## 도입부 전략\n${hookObj.prompt}` : "";
    
    const result = await callFor("write", `당신은 네이버 블로그 상위 노출 전문가입니다. 네이버 C-Rank와 D.I.A.+ 알고리즘을 완벽히 이해하고 있습니다.

## 핵심 정보
- 메인 키워드: ${mainKeyword}
- 서브 키워드: ${subKw}
- 주제: ${topic}
- 타겟 독자: ${target}
- 연락처: ${contact}
${briefingSection}
${personaSection}
${hookSection}
${fwSection}

## 글쓰기 스타일: ${style?.label || "낚시형"}
${style?.prompt || ""}

## 네이버 SEO 최적화 규칙 (2025-2026 기준)

### 1. 제목 (필수: 맨 위에 후보 3개 번호로)
- 호기심 유발 + 키워드 자연 포함 (억지로 넣지 말 것)
- 15-30자 내외, 구체적인 숫자나 연도 포함
- 금칙어("무료","최고","최저","확실한","보장") 사용 금지
- 예: "60대 부모님 보험, 3개월 알아보고 내린 결론" (O)
- 예: "노인보험 추천 TOP5" (X — 너무 기계적)

### 2. 도입부 (첫 3문장이 체류시간을 결정)
- 독자가 "이건 내 이야기다"라고 느끼는 공감 포인트로 시작
- 절대 "안녕하세요~ 오늘은 ~에 대해 알아보겠습니다" 패턴 금지
- 첫 문장에서 감정(걱정, 궁금증, 공감)을 건드릴 것

### 3. 본문 구조
- 소제목 3-4개 (키워드 나열식 금지, 자연스러운 맥락형으로)
  - 나쁜 예: "노인보험이란?", "노인보험 종류", "노인보험 가입방법"
  - 좋은 예: "처음 알아보면서 가장 헷갈렸던 것", "비교해보니 이런 차이가 있었어요"
- 각 섹션은 정보 → 개인 해석/의견 → 독자에게 적용하는 패턴
- 중간에 "그런데 여기서 중요한 게 있는데요" 같은 전환 문장으로 계속 읽게 유도
- 구체적인 수치, 나이, 조건 등을 포함하여 신뢰감 형성

### 4. 키워드 전략 (빈도 < 맥락)
- 메인 키워드를 문맥에 자연스럽게 녹일 것 (억지 삽입 금지)
- 서브 키워드도 관련 맥락에서 자연스럽게 언급
- 동의어, 유사어를 다양하게 사용 (예: 보험 → 보장, 가입 → 준비/신청)
- 키워드 밀도보다 의미적 관련성(Semantic Relevance)이 중요

### 5. CTA (글 전체의 10% 이하)
- 마지막 단락에서만 자연스럽게 한 번
- "~가 궁금하신 분은", "~에 대해 더 알고 싶다면" 정도로 부드럽게
${contact ? `- 연락처: ${contact}` : "- 연락처 없이 마무리"}

### 6. 태그 10-15개
- 메인/서브 키워드 포함, 관련 롱테일 키워드 추가

### 7. 분량
- 1800-2500자 (너무 짧으면 체류시간 부족, 너무 길면 이탈)

## 출력 형식
제목 후보 3개 (번호로) → 빈 줄 → 본문 전체 → 빈 줄 → 태그

## 중요: 하지 말아야 할 것
- "안녕하세요", "오늘은 ~에 대해" 로 시작하지 마세요
- 소제목을 키워드+명사 나열로 하지 마세요
- 마크다운 bold(**) 남용하지 마세요 — 네이버 에디터에서 깨집니다
- 키워드를 인위적으로 반복하지 마세요
- "~입니다", "~합니다"만 반복하지 말고 다양한 종결어미를 사용하세요`);
    const cleanResult = result.replace(/^⚠️[^\n]*\n*/i, "");
    const titles = parseTitles(cleanResult);
    setTitleCandidates(titles);
    const body = stripTitleSection(cleanResult, titles);
    setBlog(body);
    if (titles.length > 0) setBlogTitle(titles[0]);
    saveToHistory(titles[0] || topic, body);
    setLoading("");
  };

  // Strip AI analysis/commentary from output
  const stripAiAnalysis = (text) => {
    // First strip auto-fallback warning
    let cleaned = (text || "").replace(/^⚠️\s*\S+\s*접속\s*불가\s*→\s*Claude로\s*자동\s*전환됨\s*\n*/i, "").trim();
    const lines = cleaned.split("\n");
    let startIdx = 0;
    // Skip lines that look like AI analysis at the top
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const l = lines[i].trim();
      if (l.match(/^(글을\s*분석|분석\s*결과|다음|아래|수정|변경|금칙어를?\s*찾|발견|확인|처리)/)) { startIdx = i + 1; continue; }
      if (l.match(/^\d+\.\s*\*\*["""]/) || l.match(/^\d+\.\s*["""]/) || l.match(/^[-•]\s*\*\*/)) { startIdx = i + 1; continue; }
      if (l === "" && startIdx > 0 && startIdx === i) { startIdx = i + 1; continue; }
      break;
    }
    // Also strip trailing AI commentary
    let endIdx = lines.length;
    for (let i = lines.length - 1; i > startIdx; i--) {
      const l = lines[i].trim();
      if (l.match(/^(위|이상|모든|금칙어.*제거|수정.*완료|변경.*사항)/)) { endIdx = i; continue; }
      if (l === "" && endIdx < lines.length && endIdx === i + 1) { endIdx = i; continue; }
      break;
    }
    return lines.slice(startIdx, endIdx).join("\n").trim();
  };

  // Strip auto-fallback warning from AI results
  const stripFallback = (text) => {
    if (!text) return text;
    return text.replace(/^⚠️\s*\S+\s*접속\s*불가\s*→\s*Claude로\s*자동\s*전환됨\s*\n*/i, "").trim();
  };

  // Extract sentences containing forbidden words with surrounding context
  const extractFwSentences = (text, fwList) => {
    const lines = text.split("\n");
    const results = []; // { lineIdx, line, words: ["가입", ...], prevLine, nextLine }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const foundWords = [];
      for (const fw of fwList) {
        if (fw.isImageOnly) continue;
        const re = new RegExp(fw.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        if (re.test(line)) foundWords.push(fw.word);
      }
      if (foundWords.length > 0) {
        results.push({
          lineIdx: i,
          line,
          words: foundWords,
          prevLine: i > 0 ? lines[i - 1] : "",
          nextLine: i < lines.length - 1 ? lines[i + 1] : "",
        });
      }
    }
    return results;
  };

  // Sentence-level replacement: only send problematic sentences to AI, keep everything else untouched
  const rewriteAvoidFw = async () => {
    const textToFix = fixedBlog || checkText || blog;
    if (!textToFix) return;

    let remaining = [];
    for (const fw of forbidden) {
      const m = textToFix.match(new RegExp(fw.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
      if (m) remaining.push({ word: fw.word, count: m.length, isImageOnly: fw.isImageOnly });
    }

    if (remaining.length === 0) {
      setLoading("문장 다듬는 중...");
      setAiAttempts(p => p + 1);
      const result = await callFor("forbidden", `아래 글에서 기계적으로 단어를 치환한 부분이 있어 문장이 어색할 수 있습니다.
자연스럽게 다듬어 주세요. 내용, 구조, 길이는 유지하고 어색한 문장만 수정하세요.

중요: 분석이나 설명 없이 수정된 글만 출력하세요.

${textToFix}`);
      setFixedBlog(stripAiAnalysis(result));
      setLoading("");
      return;
    }

    // Find lines containing forbidden words
    const lines = textToFix.split("\n");
    const fwLines = []; // { lineIdx, line, words[], prevLine, nextLine }
    for (let i = 0; i < lines.length; i++) {
      const found = [];
      for (const fw of forbidden) {
        if (lines[i].includes(fw.word)) found.push(fw.word);
      }
      if (found.length > 0) {
        fwLines.push({
          lineIdx: i, line: lines[i], words: found,
          prevLine: lines[i - 1] || "", nextLine: lines[i + 1] || "",
        });
      }
    }

    if (fwLines.length === 0) { setFixedBlog(textToFix); return; }

    setLoading(`AI 금칙어 우회 중... (${fwLines.length}개 줄)`);
    setAiAttempts(p => p + 1);
    abortRef.current = new AbortController();

    // Build prompt: ONLY the problematic lines, ask for replacements
    const fwDetail = remaining.map(d => {
      if (d.isImageOnly) return `"${d.word}" → [이미지: ${d.word}]`;
      const rep = forbidden.find(f => f.word === d.word)?.replacement;
      return `"${d.word}"${rep ? ` → "${rep}"` : ""}`;
    }).join(", ");

    let linePrompts = fwLines.map((fl, i) => {
      return `[${i}] 금칙어: ${fl.words.join(", ")}
앞줄: ${fl.prevLine.trim().substring(0, 80) || "(없음)"}
★원문: ${fl.line}
뒷줄: ${fl.nextLine.trim().substring(0, 80) || "(없음)"}`;
    }).join("\n\n");

    try {
      const result = await callFor("forbidden", `금칙어가 포함된 문장들을 수정해주세요.

금칙어 목록: ${fwDetail}

## 수정 대상 문장들
${linePrompts}

## 규칙
- 각 ★원문의 금칙어만 다른 표현으로 바꾸세요
- 문장 길이를 거의 동일하게 유지하세요 (±10자 이내)
- 문장 구조, 어미, 톤을 유지하세요
- <br> 태그, [이미지:...] 마커는 그대로 유지
- 앞뒤 문맥에 자연스럽게 이어지도록 작성

## 출력 형식 (반드시 이 형식으로만!)
[0] 수정된 문장
[1] 수정된 문장
[2] 수정된 문장
...

설명이나 분석 없이 위 형식으로만 출력하세요.`);

      // Parse AI response: extract [N] lines
      const cleaned = result.replace(/^⚠️[^\n]*\n*/i, "");
      const replacements = {};
      const rLines = cleaned.split("\n");
      for (const rl of rLines) {
        const m = rl.match(/^\[(\d+)\]\s*(.+)$/);
        if (m) {
          const idx = parseInt(m[1]);
          const newLine = m[2].trim();
          if (idx < fwLines.length && newLine.length > 5) {
            replacements[fwLines[idx].lineIdx] = newLine;
          }
        }
      }

      // Apply replacements to original lines
      const newLines = [...lines];
      for (const [lineIdx, newLine] of Object.entries(replacements)) {
        newLines[parseInt(lineIdx)] = newLine;
      }
      const finalText = newLines.join("\n");
      setFixedBlog(finalText);

      // Check if any remain
      let stillRemain = [];
      for (const fw of forbidden) {
        const m = finalText.match(new RegExp(fw.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
        if (m) stillRemain.push({ word: fw.word, count: m.length });
      }

      // Retry once more for remaining
      if (stillRemain.length > 0) {
        const newFwLines = [];
        const nLines = finalText.split("\n");
        for (let i = 0; i < nLines.length; i++) {
          const found = [];
          for (const fw of forbidden) {
            if (nLines[i].includes(fw.word)) found.push(fw.word);
          }
          if (found.length > 0) {
            newFwLines.push({ lineIdx: i, line: nLines[i], words: found,
              prevLine: nLines[i - 1] || "", nextLine: nLines[i + 1] || "" });
          }
        }

        if (newFwLines.length > 0) {
          setLoading(`⚠️ ${stillRemain.length}개 남음 — 재시도...`);
          setAiAttempts(p => p + 1);

          const retryPrompts = newFwLines.map((fl, i) =>
            `[${i}] 금칙어: ${fl.words.join(", ")}\n★원문: ${fl.line}`
          ).join("\n\n");

          const result2 = await callFor("forbidden", `아직 금칙어가 남았습니다. 아래 문장에서 금칙어를 반드시 제거하세요.

금칙어: ${stillRemain.map(r => `"${r.word}"`).join(", ")}

${retryPrompts}

규칙: 금칙어 단어만 교체. 문장 길이 유지. 설명 없이 [번호] 수정문장 형식으로만 출력.`);

          const cleaned2 = result2.replace(/^⚠️[^\n]*\n*/i, "");
          const reps2 = {};
          for (const rl of cleaned2.split("\n")) {
            const m = rl.match(/^\[(\d+)\]\s*(.+)$/);
            if (m && parseInt(m[1]) < newFwLines.length && m[2].trim().length > 5) {
              reps2[newFwLines[parseInt(m[1])].lineIdx] = m[2].trim();
            }
          }
          const finalLines = finalText.split("\n");
          for (const [lineIdx, newLine] of Object.entries(reps2)) {
            finalLines[parseInt(lineIdx)] = newLine;
          }
          setFixedBlog(finalLines.join("\n"));
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") setFixedBlog(textToFix);
    }
    setLoading("");
  };

  const generateImages = async () => {
    setLoading("프롬프트 생성 중...");
    abortRef.current = new AbortController();
    const content = fixedBlog || blog;
    const imgFw = forbidden.filter(f => f.isImageOnly);
    const imgMarkers = [...content.matchAll(/\[이미지:\s*([^\]]+)\]/g)].map(m => m[1].trim());
    const slotCount = preSlotCount;

    // Build per-slot style instructions
    const slotStyleGuide = Array.from({ length: slotCount }, (_, i) => {
      const styleId = preSlotStyles[i] || "general";
      const s = IMG_STYLES.find(x => x.id === styleId) || IMG_STYLES[0];
      return `이미지 ${i + 1}: ${s.label} 스타일 — ${s.prompt}`;
    }).join("\n");

    try {
      const result = await callFor("images", `블로그 글에 삽입할 이미지 ${slotCount}개의 프롬프트를 JSON 배열로 만드세요.

## 각 이미지별 스타일 (반드시 따르세요 — 각각 다릅니다!)
${slotStyleGuide}

## 한국어 텍스트 규칙 (매우 중요)
- 이미지 1, 2: 반드시 한국어 텍스트/라벨/설명을 포함하세요. 블로그 글의 핵심 내용을 시각적으로 정리한 설명형 이미지로 만드세요.
  예: 비교표, 핵심 포인트 3가지, 단계별 프로세스, 체크리스트 등 글의 세부 내용이 한국어로 적혀있는 인포그래픽
  프롬프트에 포함할 한국어 텍스트를 구체적으로 지정하세요 (예: "등급 판정 기준", "1등급: 최중증", "2등급: 중증" 등)
- 이미지 3 이후: 텍스트 없이 분위기/감성 위주의 비주얼 이미지
${imgFw.length ? `\n금칙어 이미지 (필수): ${imgFw.map(f=>f.word).join(", ")} — 텍스트 없이 비주얼로 전달` : ""}
${imgMarkers.length ? `\n본문 마커: ${imgMarkers.join(", ")}` : ""}
${imgExtraNotes.trim() ? `\n## 추가 요청사항\n${imgExtraNotes.trim()}` : ""}

글:
${content.substring(0, 2500)}

반드시 아래 JSON 형식으로만 출력. 다른 설명 금지:
[
  {"position":"소제목1 아래","prompt":"Detailed image prompt here. Include Korean text: '한국어 텍스트'","alt":"네이버 alt 텍스트 한글","purpose":"이미지 목적 한글","hasText":true},
  {"position":"소제목2 아래","prompt":"Detailed prompt with Korean labels: '라벨1', '라벨2'","alt":"alt","purpose":"목적","hasText":true},
  {"position":"소제목3 아래","prompt":"Visual-only prompt, no text in image","alt":"alt","purpose":"목적","hasText":false}
]`);

      const cleanImgResult = result.replace(/^⚠️[^\n]*\n*/i, "");
      let parsed = [];
      try {
        const jsonMatch = cleanImgResult.match(/\[[\s\S]*\]/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch { /* fallback below */ }

      if (parsed.length === 0) {
        const lines = cleanImgResult.split("\n").filter(l => l.trim());
        for (let i = 0; i < Math.min(slotCount, lines.length); i++) {
          parsed.push({ position: `이미지 ${i+1}`, prompt: lines[i], alt: "", purpose: "" });
        }
      }

      const slots = parsed.slice(0, 8).map((p, i) => ({
        id: i, position: p.position || `이미지 ${i+1}`,
        prompt: p.prompt || "", alt: p.alt || "", purpose: p.purpose || "",
        hasText: p.hasText === true || i < 2, // first 2 images have text by default
        style: preSlotStyles[i] || "general", imgModel: "gemini-3-pro-image-preview", image: null, imgLoading: false, imgError: "",
      }));
      setImgSlots(slots);
    } catch (e) {
      if (e.name !== "AbortError") setImgSlots([{ id: 0, position: "오류", prompt: e.message, alt: "", purpose: "", style: "general", imgModel: "gemini-3-pro-image-preview", image: null, imgLoading: false, imgError: "" }]);
    }
    setLoading("");
  };

  const updateSlot = (id, field, value) => {
    setImgSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSlot = () => {
    if (imgSlots.length >= 8) return;
    setImgSlots(prev => [...prev, { id: Date.now(), position: `이미지 ${prev.length+1}`, prompt: "", alt: "", purpose: "", hasText: false, style: "general", imgModel: "gemini-3-pro-image-preview", image: null, imgLoading: false, imgError: "" }]);
  };

  const removeSlot = (id) => setImgSlots(prev => prev.filter(s => s.id !== id));


  const genOneImage = async (slot) => {
    const key = apiKeys.gemini;
    updateSlot(slot.id, "imgLoading", true);
    updateSlot(slot.id, "imgError", "");
    abortRef.current = new AbortController();
    const stylePrompt = IMG_STYLES.find(s => s.id === slot.style)?.prompt || "";
    try {
      const textRule = slot.hasText ? "Korean text should be clearly readable and accurate." : "No text or letters in image.";
      const fullPrompt = `${slot.prompt}. Style: ${stylePrompt}. ${textRule}`;
      const dataUrl = await generateGeminiImage(fullPrompt, key, abortRef.current.signal, slot.imgModel);
      updateSlot(slot.id, "image", dataUrl);
    } catch (e) {
      if (e.name === "AbortError") { updateSlot(slot.id, "imgLoading", false); return; }
      updateSlot(slot.id, "imgError", e.message);
    }
    updateSlot(slot.id, "imgLoading", false);
  };

  const genAllImages = async () => {
    const key = apiKeys.gemini;
    setLoading("전체 이미지 생성 중...");
    abortRef.current = new AbortController();
    for (const slot of imgSlots) {
      if (!slot.prompt) continue;
      updateSlot(slot.id, "imgLoading", true);
      updateSlot(slot.id, "imgError", "");
      const stylePrompt = IMG_STYLES.find(s => s.id === slot.style)?.prompt || "";
      try {
        const textRule = slot.hasText ? "Korean text should be clearly readable and accurate." : "No text or letters in image.";
      const fullPrompt = `${slot.prompt}. Style: ${stylePrompt}. ${textRule}`;
        const dataUrl = await generateGeminiImage(fullPrompt, key, abortRef.current.signal, slot.imgModel);
        updateSlot(slot.id, "image", dataUrl);
      } catch (e) {
        if (e.name === "AbortError") break;
        updateSlot(slot.id, "imgError", e.message);
      }
      updateSlot(slot.id, "imgLoading", false);
    }
    setLoading("");
  };

  const downloadImage = (dataUrl, filename) => {
    const a = document.createElement("a");
    a.href = dataUrl; a.download = filename; a.click();
  };

  const downloadAllImages = () => {
    imgSlots.filter(s => s.image).forEach((s, i) => {
      setTimeout(() => downloadImage(s.image, `blog-image-${i+1}.png`), i * 500);
    });
  };

  // File name prefix: YYYYMMDD_키워드_조회수
  const getFilePrefix = () => {
    const d = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
    const kw = (selectedKw?.keyword || manualKw || "블로그").replace(/[\\/:*?"<>|]/g, "").trim();
    const vol = selectedKw?.total ? `${selectedKw.total}` : "0";
    return `${date}_${kw}_${vol}`;
  };

  // Save all (text + images) to user-selected directory
  const saveAllToFolder = async () => {
    const prefix = getFilePrefix();
    const textContent = fixedBlog || blog || "";
    const images = imgSlots.filter(s => s.image);

    // Try File System Access API (Chrome/Edge)
    if (window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });

        // Save text
        if (textContent) {
          const txtFile = await dirHandle.getFileHandle(`${prefix}_본문.txt`, { create: true });
          const writable = await txtFile.createWritable();
          await writable.write(textContent);
          await writable.close();
        }

        // Save images
        for (let i = 0; i < images.length; i++) {
          const s = images[i];
          const blob = await (await fetch(s.image)).blob();
          const imgFile = await dirHandle.getFileHandle(`${prefix}_이미지${String(i+1).padStart(2,"0")}.png`, { create: true });
          const writable = await imgFile.createWritable();
          await writable.write(blob);
          await writable.close();
        }

        alert(`✅ 저장 완료!\n📄 ${prefix}_본문.txt\n🖼️ 이미지 ${images.length}장`);
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
        // Fallback below
      }
    }

    // Fallback: individual downloads
    if (textContent) {
      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${prefix}_본문.txt`;
      a.click();
    }
    images.forEach((s, i) => {
      setTimeout(() => downloadImage(s.image, `${prefix}_이미지${String(i+1).padStart(2,"0")}.png`), i * 500);
    });
  };

  // Regenerate single image prompt
  const regenOnePrompt = async (slotId) => {
    const slot = imgSlots.find(s => s.id === slotId);
    if (!slot) return;
    const content = fixedBlog || blog || "";
    const styleInfo = IMG_STYLES.find(s => s.id === slot.style) || IMG_STYLES[0];
    setLoading(`#${slotId + 1} 프롬프트 재생성...`);
    abortRef.current = new AbortController();
    try {
      const result = await callFor("images", `블로그 글의 "${slot.position}" 위치에 들어갈 이미지 1개의 프롬프트를 만드세요.
스타일: ${styleInfo.label} — ${styleInfo.prompt}
${slot.hasText ? "한국어 텍스트 포함: 블로그 글의 핵심 내용을 한국어 라벨/설명으로 포함하세요." : "텍스트 없이 비주얼만."}
기존 프롬프트 참고 (새로 만들어야 함): ${slot.prompt}
목적: ${slot.purpose || slot.alt || ""}

글 요약:
${content.substring(0, 1500)}

JSON 형식으로만 출력:
{"prompt":"Detailed prompt${slot.hasText ? ", include Korean text: '한국어'" : ", no text in image"}","alt":"한글 alt","purpose":"한글 목적"}`);
      const clean = result.replace(/^⚠️[^\n]*\n*/i, "");
      try {
        const json = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || "{}");
        if (json.prompt) {
          updateSlot(slotId, "prompt", json.prompt);
          if (json.alt) updateSlot(slotId, "alt", json.alt);
          if (json.purpose) updateSlot(slotId, "purpose", json.purpose);
          updateSlot(slotId, "image", null);
          updateSlot(slotId, "imgError", "");
        }
      } catch { updateSlot(slotId, "prompt", clean.substring(0, 500)); }
    } catch (e) { if (e.name !== "AbortError") updateSlot(slotId, "imgError", e.message); }
    setLoading("");
  };

  // Save current state snapshot to history
  const saveSnapshot = () => {
    const snap = {
      title: blogTitle || "제목 없음",
      keyword: selectedKw?.keyword || manualKw || "",
      volume: selectedKw?.total || 0,
      body: fixedBlog || blog || "",
      step,
      timestamp: new Date().toISOString(),
      imgCount: imgSlots.filter(s => s.image).length,
    };
    setHistory(prev => {
      const next = [snap, ...prev].slice(0, 50);
      save("nv-history", next);
      return next;
    });
    alert("✅ 현재 진행 상태가 저장되었습니다.");
  };

  // Load snapshot
  const loadSnapshot = (h) => {
    if (h.body) { setBlog(h.body); setCheckText(""); setFixedBlog(""); }
    if (h.title) setBlogTitle(h.title);
    if (h.keyword) setManualKw(h.keyword);
    setShowHistoryModal(false);
    setStep("write");
  };

  // ── Settings Panel ──
  const renderSettings = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSettings(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, width: 480, maxHeight: "80vh", overflow: "auto", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>⚙️ AI 설정</h2>
          <button onClick={() => setShowSettings(false)} style={{ ...btnS, fontSize: 16, padding: "4px 10px" }}>✕</button>
        </div>

        {/* Per-step AI overview */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ ...lbl, marginBottom: 10 }}>📍 페이지별 AI 설정</label>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>각 페이지에서 직접 AI를 선택할 수 있습니다. 여기서는 현재 설정을 확인합니다.</div>
          <div style={{ fontSize: 11, color: "#22c55e", background: "rgba(34,197,94,0.06)", padding: "6px 10px", borderRadius: 6, marginBottom: 10, lineHeight: 1.5 }}>
            🔑 BYOK 모드: 각 AI의 API 키를 아래에서 입력하세요. 키는 브라우저에만 저장됩니다.
          </div>
          {[
            { id: "write", label: "✍️ 글 작성", desc: "블로그 글 생성 + 키워드 연관어" },
            { id: "forbidden", label: "🚫 금칙어", desc: "AI 우회 재작성 + 문장 다듬기" },
            { id: "images", label: "🎨 이미지", desc: "프롬프트 생성 (이미지 생성은 Gemini 전용)" },
          ].map(s => {
            const a = aiFor(s.id);
            const st = statusOf(a.provider);
            const stColor = st === "ok" ? "#22c55e" : st === "blocked" ? "#ef4444" : st === "nokey" ? "#f59e0b" : "#64748b";
            const stLabel = st === "ok" ? "✓ 연결됨" : st === "blocked" ? "✕ 차단 (→Claude 자동전환)" : st === "nokey" ? "🔑 키 필요" : "미확인";
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.04)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: stColor }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", minWidth: 80 }}>{s.label}</span>
                <span style={{ fontSize: 12, color: a.info.color, fontWeight: 600 }}>{a.info.icon} {a.info.name}</span>
                <span style={{ fontSize: 11, color: "#475569" }}>{(() => { const m = AI_MODELS[a.provider]?.models.find(x => x.id === a.model); return m ? `${m.label} (${m.price})` : a.model; })()}</span>
                <span style={{ fontSize: 10, color: stColor, marginLeft: "auto" }}>{stLabel}</span>
              </div>
            );
          })}
        </div>

        {/* API Keys */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ ...lbl, marginBottom: 8 }}>API 키 관리</label>
          <div style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, marginBottom: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <span style={{ color: "#22c55e" }}>🔑 <b>BYOK</b> — Bring Your Own Key. 키는 브라우저 localStorage에만 저장됩니다.</span>
          </div>

          {/* Claude Key */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: AI_MODELS.claude.color }}>{AI_MODELS.claude.icon} Anthropic (Claude)</span>
              {apiKeys.claude && <span style={{ fontSize: 12, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 4 }}>✓ 등록됨</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type={showKeys.claude ? "text" : "password"}
                value={apiKeys.claude}
                onChange={e => setApiKeys(p => ({ ...p, claude: e.target.value }))}
                placeholder="sk-ant-..."
                style={{ ...inp, flex: 1, fontFamily: "monospace", fontSize: 14 }}
              />
              <button onClick={() => setShowKeys(p => ({ ...p, claude: !p.claude }))} style={{ ...btnS, fontSize: 13 }}>
                {showKeys.claude ? "숨김" : "보기"}
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
              발급: <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" style={{ color: "#64748b" }}>console.anthropic.com</a>
            </div>
          </div>

          {/* GPT Key */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: AI_MODELS.gpt.color }}>{AI_MODELS.gpt.icon} OpenAI (GPT)</span>
              {apiKeys.gpt && <span style={{ fontSize: 12, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 4 }}>✓ 등록됨</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type={showKeys.gpt ? "text" : "password"}
                value={apiKeys.gpt}
                onChange={e => setApiKeys(p => ({ ...p, gpt: e.target.value }))}
                placeholder="sk-..."
                style={{ ...inp, flex: 1, fontFamily: "monospace", fontSize: 14 }}
              />
              <button onClick={() => setShowKeys(p => ({ ...p, gpt: !p.gpt }))} style={{ ...btnS, fontSize: 13 }}>
                {showKeys.gpt ? "숨김" : "보기"}
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
              발급: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" style={{ color: "#64748b" }}>platform.openai.com/api-keys</a>
            </div>
          </div>

          {/* Gemini Key */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: AI_MODELS.gemini.color }}>{AI_MODELS.gemini.icon} Google (Gemini)</span>
              {apiKeys.gemini && <span style={{ fontSize: 12, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 4 }}>✓ 등록됨</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type={showKeys.gemini ? "text" : "password"}
                value={apiKeys.gemini}
                onChange={e => setApiKeys(p => ({ ...p, gemini: e.target.value }))}
                placeholder="AIza..."
                style={{ ...inp, flex: 1, fontFamily: "monospace", fontSize: 14 }}
              />
              <button onClick={() => setShowKeys(p => ({ ...p, gemini: !p.gemini }))} style={{ ...btnS, fontSize: 13 }}>
                {showKeys.gemini ? "숨김" : "보기"}
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
              발급: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color: "#64748b" }}>aistudio.google.com/apikey</a>
            </div>
          </div>
        </div>

        {/* Naver Search Ad API */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ ...lbl, marginBottom: 10 }}>📊 네이버 검색광고 API (키워드 자동 조회용)</label>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 10, lineHeight: 1.5 }}>
            등록하면 키워드 검색량을 자동으로 조회합니다. 네이버 광고 계정만 있으면 무료 발급.
          </div>
          {[
            { key: "customerId", label: "Customer ID", placeholder: "숫자 (예: 1234567)" },
            { key: "apiKey", label: "API Key (액세스 라이선스)", placeholder: "영문+숫자" },
            { key: "secretKey", label: "Secret Key (비밀키)", placeholder: "영문+숫자" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 3 }}>{label}</div>
              <input
                type={showKeys.naver ? "text" : "password"}
                value={naverKeys[key]}
                onChange={e => setNaverKeys(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ ...inp, fontFamily: "monospace", fontSize: 14 }}
              />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setShowKeys(p => ({ ...p, naver: !p.naver }))} style={{ ...btnS, fontSize: 12 }}>
              {showKeys.naver ? "숨김" : "키 보기"}
            </button>
            <div style={{ fontSize: 12, color: "#475569" }}>
              발급: <a href="https://searchad.naver.com" target="_blank" rel="noopener" style={{ color: "#64748b" }}>searchad.naver.com</a> → 도구 → API 사용관리
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: 14, border: "1px solid rgba(99,102,241,0.1)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#6366f1", marginBottom: 6 }}>💡 참고</div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
            • Claude는 이 앱 내에서 API 키 없이 바로 사용 가능<br/>
            • GPT/Gemini는 각 서비스에서 API 키 발급 필요<br/>
            • 네이버 API 등록 시 키워드 검색량 자동 조회 가능<br/>
            • 네이버 API가 CORS로 차단될 경우 수동 붙여넣기 사용<br/>
            • 키는 이 앱에만 저장되며 외부 전송 없음
          </div>
        </div>
      </div>
    </div>
  );

  // ── Keyword Step ──
  const renderKeywords = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "calc(100vh - 150px)", minHeight: 600 }}>
      {/* Keyword Research Area — 2 column */}
      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>

      {/* Left: Input & Tools */}
      <div style={{ flex: "0 0 380px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>

        {/* Direct Keyword Volume Search — TOP AND PROMINENT */}
        <div style={{ ...card, border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.03)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>📊 키워드 검색량 조회</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={seedKw} onChange={e => setSeedKw(e.target.value)} placeholder="키워드 입력 (예: 노인보험)" style={{ ...inp, flex: 1, fontSize: 13, padding: "10px 12px" }} onKeyDown={e => {
              if (e.key === "Enter" && seedKw.trim()) {
                if (naverHasKeys) {
                  autoSearchNaver([seedKw.trim()]);
                } else {
                  generateRelated();
                }
              }
            }} />
            {naverHasKeys ? (
              <button onClick={() => seedKw.trim() && autoSearchNaver([seedKw.trim()])} disabled={!!loading || !seedKw.trim()} style={{ ...btn1, padding: "12px 18px", fontSize: 14, background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                {loading && loading.includes("네이버") ? "⏳" : "🔍 조회"}
              </button>
            ) : null}
            <button onClick={generateRelated} disabled={!!loading || !seedKw.trim()} style={{ ...btn1, padding: "12px 16px", fontSize: 14 }}>
              {loading && loading.includes("키워드") ? "⏳" : "🤖 AI생성"}
            </button>
            {loading && <button onClick={stopAI} style={{ ...btn2, padding: "10px 14px", fontSize: 13, color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>⏹ 중지</button>}
          </div>

          {/* Naver API status — always visible */}
          {naverHasKeys ? (
            <div style={{ fontSize: 12, color: "#16a34a", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              🟢 네이버 API 연동됨 — "조회"로 검색량 확인, "AI생성"으로 연관 키워드 + 자동 조회
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 6, lineHeight: 1.5 }}>
              ⚠️ 네이버 API 미설정
              <button onClick={() => setShowSettings(true)} style={{ ...btnS, fontSize: 11, marginLeft: 6, color: "#6366f1" }}>⚙️ API 설정</button>
            </div>
          )}

          {/* AI selector for keyword generation */}
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#475569" }}>AI생성 엔진:</span>
            <AIPicker stepId="write" />
          </div>
          {naverStatus.startsWith("error:") && (
            <div style={{ fontSize: 12, color: "#f87171", marginTop: 4, padding: "5px 8px", background: "rgba(239,68,68,0.06)", borderRadius: 6, lineHeight: 1.5 }}>
              ❌ {naverStatus.slice(6)}
              <button onClick={() => setShowSettings(true)} style={{ ...btnS, fontSize: 11, marginLeft: 6, color: "#6366f1" }}>⚙️ 설정</button>
            </div>
          )}
          {naverStatus === "ok" && (
            <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>✅ 조회 완료 — 결과가 오른쪽 테이블에 표시됩니다</div>
          )}
        </div>

        {/* AI Related Keywords */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#6366f1" }}>🤖 AI 연관 키워드</div>
            {relatedKws.length > 0 && naverHasKeys && (
              <button onClick={autoSearchAll} disabled={!!loading} style={{ ...btn1, padding: "4px 10px", fontSize: 12, background: naverStatus === "ok" ? "linear-gradient(135deg, #334155, #475569)" : "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                {naverStatus === "ok" ? "🔄 재조회" : `⚡ ${relatedKws.length}개 전체 조회`}
              </button>
            )}
          </div>
          {relatedKws.length === 0 ? (
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
              위에서 키워드 입력 → "AI생성" 클릭 → 연관 키워드 30개 생성<br/>
              {naverHasKeys ? "→ 자동으로 검색량 조회까지 진행됩니다" : "→ 생성 후 수동 검색량 조회 필요"}
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 3 }}>
                {relatedKws.map((kw, i) => {
                  const isSeed = kw === seedKw.trim();
                  return (
                  <button key={i} onClick={() => copyKw(kw, i)} style={{
                    padding: "3px 8px", borderRadius: 5, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                    border: `1px solid ${copiedIdx === i ? "rgba(34,197,94,0.3)" : isSeed ? "rgba(251,146,60,0.4)" : "rgba(165,180,252,0.15)"}`,
                    background: copiedIdx === i ? "rgba(34,197,94,0.15)" : isSeed ? "rgba(251,146,60,0.12)" : "rgba(165,180,252,0.06)",
                    color: copiedIdx === i ? "#4ade80" : isSeed ? "#fb923c" : "#6366f1",
                    fontWeight: isSeed ? 700 : 400,
                  }}>{copiedIdx === i ? "✓" : (isSeed ? "⭐ " + kw : kw)}</button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>클릭 = 복사</div>
            </>
          )}
        </div>

        {/* Manual tools — always visible */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>🔗 수동 조회 도구</div>
          <div style={{ display: "flex", gap: 6 }}>
            <a href={"https://manage.searchad.naver.com/tool/keyword-planner"}
              target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: "9px", fontSize: 13, fontWeight: 600, background: "linear-gradient(135deg, #00c73c, #009f29)", textDecoration: "none", textAlign: "center", display: "block", borderRadius: 7, color: "#fff" }}
            >🟢 네이버 키워드도구 ↗</a>
            <a href="https://whereispost.com/keyword/"
              target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: "9px", fontSize: 13, fontWeight: 600, background: "linear-gradient(135deg, #f59e0b, #f97316)", textDecoration: "none", textAlign: "center", display: "block", borderRadius: 7, color: "#fff" }}
            >🔍 키워드마스터 ↗</a>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <a href="https://whereispost.com/muhan/" target="_blank" rel="noopener noreferrer" style={{ padding: "3px 8px", borderRadius: 5, fontSize: 11, color: "#6366f1", textDecoration: "none", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}>무한키워드 ↗</a>
            <a href="https://blackkiwi.net/" target="_blank" rel="noopener noreferrer" style={{ padding: "3px 8px", borderRadius: 5, fontSize: 11, color: "#6366f1", textDecoration: "none", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}>블랙키위 ↗</a>
            <a href="https://manage.searchad.naver.com/" target="_blank" rel="noopener noreferrer" style={{ padding: "3px 8px", borderRadius: 5, fontSize: 11, color: "#6366f1", textDecoration: "none", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}>네이버 광고 ↗</a>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
            위 도구에서 검색 → 결과 드래그+Ctrl+C → 오른쪽 붙여넣기란에 Ctrl+V
          </div>
        </div>
      </div>

      {/* Right: Results */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        {keywords.length > 0 ? (
          <div style={{ ...card, flex: 1, overflow: "auto", padding: "10px 0" }}>
            <div style={{ padding: "0 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>결과 ({keywords.length}개) — 클릭하여 선택</span>
              {keywords.some(k => !k.docs) && <span style={{ fontSize: 11, color: "#475569" }}>"-" = 검색량만</span>}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid rgba(0,0,0,0.12)" }}>
                {["", "키워드", "PC", "모바일", "총합", "문서", "비율", "점수", ""].map((h, i) => (
                  <th key={i} style={{ padding: "6px 5px", textAlign: i === 1 ? "left" : "center", color: "#475569", fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{keywords.map((kw, i) => (
                <tr key={i} onClick={() => { setSelectedKw(kw); autoSuggestSubKw(kw.keyword); }} style={{
                  borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer",
                  background: selectedKw?.keyword === kw.keyword ? "rgba(99,102,241,0.1)" : "transparent",
                }}>
                  <td style={cc}><input type="radio" checked={selectedKw?.keyword === kw.keyword} onChange={() => { setSelectedKw(kw); autoSuggestSubKw(kw.keyword); }} style={{ accentColor: "#6366f1" }} /></td>
                  <td style={{ padding: "7px 5px", fontWeight: 600, color: "#1e293b", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw.keyword}</td>
                  <td style={cc}>{kw.pc.toLocaleString()}</td>
                  <td style={cc}>{kw.mobile.toLocaleString()}</td>
                  <td style={{ ...cc, fontWeight: 700, color: kw.total >= 300 && kw.total <= 1000 ? "#4ade80" : "#f87171" }}>{kw.total.toLocaleString()}</td>
                  <td style={cc}>{kw.docs ? kw.docs.toLocaleString() : <span style={{color:"#374151"}}>-</span>}</td>
                  <td style={{ ...cc, color: kw.ratio < 500 ? "#4ade80" : kw.ratio === 0 ? "#374151" : "#f87171" }}>{kw.ratio || "-"}</td>
                  <td style={{ ...cc, fontWeight: 800, color: kw.grade.c, fontSize: 14 }}>{kw.score}<span style={{ fontSize: 11, marginLeft: 2 }}>{kw.grade.l}</span></td>
                  <td style={cc}><button onClick={e => { e.stopPropagation(); setKeywords(p => p.filter((_, j) => j !== i)); }} style={{ ...btnS, color: "#475569", fontSize: 11, padding: "1px 4px" }}>✕</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div style={{ ...card, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
            <div style={{ textAlign: "center", color: "#475569" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>키워드 데이터가 아직 없습니다</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                왼쪽에서 키워드 입력 → "조회" 또는 "AI생성"<br/>
                또는 외부 도구 결과를 위에 붙여넣기
              </div>
            </div>
          </div>
        )}

        {selectedKw && (
          <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.08)", borderRadius: 8, border: "1px solid rgba(99,102,241,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: subSuggestions.length > 0 ? 8 : 0 }}>
              <div>
                <span style={{ fontSize: 13, color: "#6366f1", fontWeight: 700 }}>✅ {selectedKw.keyword}</span>
                <span style={{ fontSize: 12, color: "#475569", marginLeft: 8 }}>검색량 {selectedKw.total.toLocaleString()} · 점수 {selectedKw.score}</span>
              </div>
              <button onClick={() => {
                if (!topic.trim()) setTopic(selectedKw.keyword + " 가이드");
                setStep("write");
              }} style={{ ...btn1, padding: "8px 20px", fontSize: 14 }}>다음: 글 작성 →</button>
            </div>
            {subSuggestions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#475569" }}>서브 후보:</span>
                {subSuggestions.slice(0, 6).map((s, i) => {
                  const inIdeal = s.total >= 500 && s.total <= 800;
                  return (
                    <span key={i} style={{ padding: "2px 7px", borderRadius: 8, fontSize: 11, background: inIdeal ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.06)", color: inIdeal ? "#4ade80" : "#94a3b8", border: `1px solid ${inIdeal ? "rgba(34,197,94,0.2)" : "rgba(0,0,0,0.08)"}` }}>
                      {s.keyword} {s.total > 0 && <span style={{ fontSize: 10, opacity: 0.7 }}>{s.total.toLocaleString()}</span>}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );


  // ── Write Step ──
  const renderWrite = () => {
    const style = WRITE_STYLES.find(s => s.id === writeStyle);
    const personaObj = PERSONAS.find(p => p.id === persona);
    const hookObj = HOOKS.find(h => h.id === hookStyle);
    return (
    <div style={{ display: "flex", gap: 16 }}>
      {/* Left: Settings Panel */}
      <div style={{ flex: "0 0 380px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Briefing */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fb923c", marginBottom: 6 }}>📝 전달할 내용</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>블로그에 담고 싶은 핵심 정보를 입력하세요</div>
          <textarea
            value={briefing}
            onChange={e => setBriefing(e.target.value)}
            placeholder={"예시:\n- 60대 이후 보험 가입이 어려워지는 이유\n- 실손보험 vs 암보험 어떤 게 먼저인지\n- 보험료 부담 줄이는 팁"}
            style={{ ...inp, height: 90, fontSize: 14, lineHeight: 1.6 }}
          />
        </div>

        {/* Persona Selection */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#c084fc", marginBottom: 6 }}>👤 글쓴이 페르소나</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {PERSONAS.map(p => (
              <button key={p.id} onClick={() => setPersona(p.id)} style={{
                padding: "6px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                border: `1.5px solid ${persona === p.id ? "#c084fc" : "rgba(0,0,0,0.08)"}`,
                background: persona === p.id ? "rgba(192,132,252,0.12)" : "transparent",
                color: persona === p.id ? "#e9d5ff" : "#64748b",
              }}>
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 11, marginTop: 1, opacity: 0.7 }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hook Style */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f472b6", marginBottom: 6 }}>🎣 도입부 훅</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {HOOKS.map(h => (
              <button key={h.id} onClick={() => setHookStyle(h.id)} style={{
                padding: "6px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                border: `1.5px solid ${hookStyle === h.id ? "#f472b6" : "rgba(0,0,0,0.08)"}`,
                background: hookStyle === h.id ? "rgba(244,114,182,0.12)" : "transparent",
                color: hookStyle === h.id ? "#fce7f3" : "#64748b",
              }}>
                <div style={{ fontWeight: 600 }}>{h.label}</div>
                <div style={{ fontSize: 11, marginTop: 1, opacity: 0.7 }}>{h.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Writing Style */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fb923c", marginBottom: 6 }}>🎯 글쓰기 스타일</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {WRITE_STYLES.map(s => (
              <button key={s.id} onClick={() => setWriteStyle(s.id)} style={{
                padding: "6px 8px", borderRadius: 7, border: `1.5px solid ${writeStyle === s.id ? s.color : "rgba(0,0,0,0.08)"}`,
                background: writeStyle === s.id ? `${s.color}15` : "transparent",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: writeStyle === s.id ? s.color : "#94a3b8" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Keywords & Meta */}
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><label style={lbl}>메인 키워드</label><input value={selectedKw?.keyword || manualKw} onChange={e => { if (!selectedKw) setManualKw(e.target.value); }} placeholder="1단계에서 선택 또는 직접 입력" style={{ ...inp, opacity: selectedKw ? 0.7 : 1 }} /></div>
            <div><label style={lbl}>서브 키워드 <span style={{ color: "#475569", fontWeight: 400 }}>(자동제안)</span></label><input value={subKw} onChange={e => setSubKw(e.target.value)} placeholder="노인보험, 시니어보험" style={inp} /></div>
            {subSuggestions.length > 0 && (
              <div style={{ gridColumn: "1/-1", display: "flex", flexWrap: "wrap", gap: 3, marginTop: -4 }}>
                <span style={{ fontSize: 11, color: "#475569", alignSelf: "center" }}>제안:</span>
                {subSuggestions.map((s, i) => {
                  const isSelected = subKw.includes(s.keyword);
                  const inIdeal = s.total >= 500 && s.total <= 800;
                  return (
                    <button key={i} onClick={() => {
                      if (isSelected) {
                        setSubKw(prev => prev.split(",").map(k=>k.trim()).filter(k=>k!==s.keyword).join(", "));
                      } else {
                        setSubKw(prev => prev.trim() ? prev + ", " + s.keyword : s.keyword);
                      }
                    }} style={{
                      padding: "2px 8px", borderRadius: 10, fontSize: 11, cursor: "pointer", transition: "all 0.15s",
                      border: `1px solid ${isSelected ? "rgba(99,102,241,0.4)" : inIdeal ? "rgba(34,197,94,0.3)" : "rgba(0,0,0,0.12)"}`,
                      background: isSelected ? "rgba(99,102,241,0.15)" : "transparent",
                      color: isSelected ? "#6366f1" : inIdeal ? "#4ade80" : "#94a3b8",
                    }}>
                      {isSelected ? "✓ " : ""}{s.keyword}
                      {s.total > 0 && <span style={{ marginLeft: 3, fontSize: 10, opacity: 0.7, color: inIdeal ? "#4ade80" : "#64748b" }}>{s.total.toLocaleString()}</span>}
                    </button>
                  );
                })}
                <span style={{ fontSize: 10, color: "#334155", alignSelf: "center", marginLeft: 4 }}>🟢=600~800 이상적</span>
              </div>
            )}
            <div style={{ gridColumn: "1/-1" }}><label style={lbl}>주제</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="60대 부모님 보험 가이드" style={inp} /></div>
            <div><label style={lbl}>연락처</label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="010-1234-5678" style={inp} /></div>
            <div><label style={lbl}>타겟</label><input value={target} onChange={e => setTarget(e.target.value)} style={inp} /></div>
          </div>
        </div>

        {/* AI Selection + Generate */}
        <div style={card}>
          <label style={lbl}>AI 선택</label>
          <AIPicker stepId="write" />
          {(() => { const m = AI_MODELS[aiFor("write").provider]?.models.find(x => x.id === aiFor("write").model); return m ? <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>💰 ~{m.price}/M 토큰 {""}</div> : null; })()}
          <button onClick={generateBlog} disabled={!!loading || (!selectedKw && !manualKw.trim()) || !topic} style={{ ...btn1, width: "100%", padding: "12px", fontSize: 13, marginTop: 10, opacity: loading || (!selectedKw && !manualKw.trim()) || !topic ? 0.4 : 1 }}>
            {loading && loading.includes("블로그") ? loading : `${aiFor("write").info.icon} 블로그 글 생성`}
          </button>
          {loading && <button onClick={stopAI} style={{ ...btn2, width: "100%", padding: "8px", fontSize: 13, marginTop: 4, color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>⏹ 중지</button>}
        </div>

        {/* History */}
        <div style={card}>
          <button onClick={() => setShowHistory(!showHistory)} style={{ ...btn2, width: "100%", padding: "8px", fontSize: 13 }}>
            📂 히스토리 ({history.length}개) {showHistory ? "▲" : "▼"}
          </button>
          {showHistory && history.length > 0 && (
            <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {history.map(h => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "rgba(0,0,0,0.03)", borderRadius: 6, fontSize: 12 }}>
                  <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => loadFromHistory(h)}>
                    <div style={{ fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
                    <div style={{ color: "#475569", fontSize: 11 }}>{h.date} · {h.keyword}</div>
                  </div>
                  <button onClick={() => loadFromHistory(h)} style={{ ...btnS, fontSize: 11, color: "#6366f1" }}>불러오기</button>
                  <button onClick={() => deleteHistory(h.id)} style={{ ...btnS, fontSize: 11, color: "#f87171" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Results Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      {!blog && (
        <div style={{ ...card, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          <div style={{ textAlign: "center", color: "#475569" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>왼쪽에서 설정 후 "블로그 글 생성" 클릭</div>
            <div style={{ fontSize: 13 }}>키워드, 주제, 스타일을 선택하면 AI가 글을 작성합니다</div>
          </div>
        </div>
      )}
      {blog && (
        <div style={card}>
          {/* Title Selection */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>📌 제목 선택</div>
            {titleCandidates.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                {titleCandidates.map((t, i) => (
                  <button key={i} onClick={() => setBlogTitle(t)} style={{
                    padding: "8px 12px", borderRadius: 7, border: `1.5px solid ${blogTitle === t ? "#f59e0b" : "rgba(0,0,0,0.1)"}`,
                    background: blogTitle === t ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.04)",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontSize: 14, color: blogTitle === t ? "#fbbf24" : "#475569",
                    fontWeight: blogTitle === t ? 700 : 400,
                  }}>
                    <span style={{ color: "#475569", marginRight: 6, fontSize: 12 }}>{i + 1}</span>{t}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                value={blogTitle}
                onChange={e => setBlogTitle(e.target.value)}
                placeholder="제목을 위에서 선택하거나 직접 입력하세요"
                style={{ ...inp, flex: 1, fontWeight: 600, fontSize: 13 }}
              />
              <button onClick={() => copyText(blogTitle)} style={btnS}>📋</button>
            </div>
          </div>

          {/* Blog Content */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>본문</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => copyText(blogTitle + "\n\n" + blog)} style={{ ...btnS, color: "#6366f1" }}>전체 복사</button>
              <button onClick={() => copyText(blog)} style={btnS}>본문 복사</button>
              <button onClick={() => setStep("forbidden")} style={{ ...btnS, background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>금칙어 →</button>
            </div>
          </div>
          <textarea value={blog} onChange={e => setBlog(e.target.value)} style={{ ...inp, minHeight: 420, lineHeight: 1.8, fontSize: 13 }} />
        </div>
      )}
      </div>
    </div>
  );};

  // ── Forbidden Step ──
  const handleFwPaste = (text) => {
    setFwPasteText(text);
    const parsed = parseFwPaste(text);
    setFwParsed(parsed);
    // Auto-add all parsed words to DB
    if (parsed.length > 0) {
      const newWords = parsed.filter(p => !forbidden.find(f => f.word === p.word));
      if (newWords.length > 0) {
        setForbidden(prev => [...prev, ...newWords.map(p => ({ word: p.word, replacement: "", isImageOnly: false }))]);
      }
    }
  };

  const renderForbidden = () => {
    // Compute remaining forbidden words in fixedBlog
    let remainCount = 0, remainList = [];
    if (fixedBlog) {
      for (const fw of forbidden) {
        const m = fixedBlog.match(new RegExp(fw.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
        if (m) { remainCount += m.length; remainList.push({ word: fw.word, count: m.length }); }
      }
    }
    // Diffs
    const diffs = [];
    if (fixedBlog && (checkText || blog)) {
      const origLines = (checkText || blog || "").split("\n");
      const fixedLines = fixedBlog.split("\n");
      for (let i = 0; i < Math.max(origLines.length, fixedLines.length); i++) {
        const orig = origLines[i] || "", fixed = fixedLines[i] || "";
        if (orig.trim() !== fixed.trim() && (orig.trim() || fixed.trim())) diffs.push({ line: i + 1, orig, fixed });
      }
    }

    return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Row 1: AI picker + 금칙어 도구 링크 ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <AIPicker stepId="forbidden" />
        <div style={{ marginLeft: "auto" }}>
          <a href="https://www.selfmoa.com/filter/wordcheck.php" target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, textDecoration: "none", background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff" }}>🔍 셀프모아 금칙어 검사 ↗</a>
        </div>
      </div>

      {/* ── Row 2: 금칙어 DB (compact inline) ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>금칙어 DB ({forbidden.length})</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input value={newFw} onChange={e => setNewFw(e.target.value)} placeholder="금칙어" style={{ ...inp, width: 80, padding: "3px 6px", fontSize: 12, margin: 0 }} onKeyDown={e => { if (e.key === "Enter") { addFw(newFw, newReplace); setNewFw(""); setNewReplace(""); }}} />
            <input value={newReplace} onChange={e => setNewReplace(e.target.value)} placeholder="대체어" style={{ ...inp, width: 80, padding: "3px 6px", fontSize: 12, margin: 0 }} onKeyDown={e => { if (e.key === "Enter") { addFw(newFw, newReplace); setNewFw(""); setNewReplace(""); }}} />
            <button onClick={() => { addFw(newFw, newReplace); setNewFw(""); setNewReplace(""); }} style={{ ...btn1, fontSize: 11, padding: "3px 8px" }}>+추가</button>
            <button onClick={() => { addFw(newFw, "", true); setNewFw(""); }} style={{ ...btn2, fontSize: 11, padding: "3px 6px" }}>🖼️</button>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
            {forbidden.some(f => !f.replacement && !f.isImageOnly) && (
              <button onClick={suggestAllReplacements} disabled={!!loading} style={{ ...btn1, fontSize: 11, padding: "3px 8px", background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>💡 대체어 자동추천</button>
            )}
            <button onClick={() => { const r = prompt("쉼표/줄바꿈으로 금칙어 일괄 입력"); if (r) r.split(/[,\n]+/).forEach(w => addFw(w.trim())); }} style={{ ...btnS, fontSize: 11 }}>+ 일괄추가</button>
            <span style={{ fontSize: 10, color: "#475569" }}>✅{forbidden.filter(f=>f.replacement && !f.isImageOnly).length} 🖼️{forbidden.filter(f=>f.isImageOnly).length} ❌{forbidden.filter(f=>!f.replacement && !f.isImageOnly).length}</span>
          </div>
        </div>

        {/* 금칙어 검사 결과 붙여넣기 (compact) */}
        <div style={{ marginBottom: 6 }}>
          <input
            value={fwPasteText}
            onChange={e => handleFwPaste(e.target.value)}
            placeholder="셀프모아/검사기 결과 붙여넣기 → 자동 인식"
            style={{ ...inp, padding: "4px 8px", fontSize: 12, margin: 0 }}
          />
          {fwParsed.length > 0 && (
            <div style={{ fontSize: 11, color: "#16a34a", marginTop: 3 }}>✅ {fwParsed.length}개 인식됨</div>
          )}
        </div>

        {/* DB list */}
        {forbidden.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxHeight: 120, overflowY: "auto" }}>
            {forbidden.map((fw, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 10, fontSize: 12, background: fw.isImageOnly ? "rgba(168,85,247,0.1)" : fw.replacement ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.1)", border: `1px solid ${fw.isImageOnly ? "rgba(168,85,247,0.15)" : fw.replacement ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.15)"}` }}>
                <span style={{ color: "#f87171", fontWeight: 600 }}>{fw.word}</span>
                {fw.isImageOnly ? <span style={{ color: "#c084fc" }}>🖼️</span> : (
                  <>
                    <span style={{ color: "#374151" }}>→</span>
                    <input value={fw.replacement} onChange={e => updateFwR(fw.word, e.target.value)} placeholder="대체어" style={{ background: "transparent", border: "none", outline: "none", color: fw.replacement ? "#4ade80" : "#f59e0b", fontSize: 12, width: Math.max(30, (fw.replacement?.length || 3) * 8), padding: 0 }} />
                  </>
                )}
                <button onClick={() => toggleFwImg(fw.word)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, padding: 0, color: "#64748b" }}>🖼️</button>
                <button onClick={() => removeFw(fw.word)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0, color: "#f87171" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Row 3: 2-panel text areas ── */}
      <div style={{ display: "flex", gap: 10 }}>

        {/* 📝 Panel 1: 원본 글 */}
        <div style={{ ...card, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>📝 원본 글</span>
            <div style={{ display: "flex", gap: 4 }}>
              {blog && <button onClick={() => { setCheckText(blog); checkForbidden(blog); }} style={{ ...btnS, fontSize: 11, color: "#6366f1" }}>2단계 글 불러오기</button>}
              <button onClick={() => checkForbidden()} disabled={!checkText && !blog || !!loading} style={{ ...btn1, fontSize: 12, padding: "4px 10px" }}>🔍 검사</button>
            </div>
          </div>
          <textarea
            value={checkText}
            onChange={e => setCheckText(e.target.value)}
            placeholder="블로그 글을 여기에 붙여넣기 → 검사 버튼 클릭"
            style={{ ...inp, flex: 1, minHeight: 350, lineHeight: 1.8, fontSize: 14, resize: "vertical" }}
          />
          {/* Detection results */}
          {detected.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: "#f87171", fontWeight: 600, marginBottom: 4 }}>⚠️ {detected.length}개 발견 (총 {detected.reduce((s,d)=>s+d.count,0)}회)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {detected.map((d, i) => (
                  <span key={i} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: d.replacement ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.1)", color: d.replacement ? "#4ade80" : "#f87171" }}>
                    {d.word}×{d.count}{d.isImageOnly ? "🖼️" : d.replacement ? `→${d.replacement}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
          {detected.length === 0 && checkText && fixedBlog && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#16a34a" }}>✅ 금칙어 없음</div>
          )}
        </div>

        {/* ✏️ Panel 2: 수정된 글 */}
        <div style={{ ...card, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: remainCount > 0 ? "#f59e0b" : fixedBlog ? "#4ade80" : "#94a3b8" }}>
              {fixedBlog ? (remainCount > 0 ? `✏️ 수정된 글 (${remainCount}개 남음)` : "✅ 수정 완료") : "✏️ 수정된 글"}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {fixedBlog && <button onClick={() => copyText(fixedBlog)} style={{ ...btnS, fontSize: 11 }}>📋 복사</button>}
              {fixedBlog && <button onClick={() => { updateHistory(fixedBlog); setBlog(fixedBlog); setCheckText(fixedBlog); setFixedBlog(""); setDetected([]); }} style={{ ...btnS, fontSize: 11, color: "#16a34a" }}>2단계 적용</button>}
              {fixedBlog && remainCount === 0 && <button onClick={() => setStep("images")} style={{ ...btnS, fontSize: 11, color: "#6366f1" }}>이미지 →</button>}
            </div>
          </div>
          <textarea
            value={fixedBlog}
            onChange={e => setFixedBlog(e.target.value)}
            placeholder="검사 후 코드 치환 결과가 여기에 표시됩니다. 직접 수동 수정도 가능합니다."
            style={{ ...inp, flex: 1, minHeight: 350, lineHeight: 1.8, fontSize: 14, resize: "vertical" }}
          />
          {/* Total forbidden word count */}
          {fixedBlog && (
            <div style={{ marginTop: 6, padding: "6px 12px", borderRadius: 8, background: remainCount > 0 ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)", border: `1px solid ${remainCount > 0 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: remainCount > 0 ? "#dc2626" : "#16a34a" }}>
                {remainCount > 0 ? `⚠️ 총 금칙어 ${remainCount}개 남음` : "✅ 금칙어 0개 — 완료!"}
              </span>
              {remainCount > 0 && <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>({remainList.map(r => `${r.word}×${r.count}`).join(", ")})</span>}
            </div>
          )}
          {/* Remaining forbidden + AI rewrite button */}
          {remainCount > 0 && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, flex: 1 }}>
                {remainList.map((r, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(239,68,68,0.12)", color: "#f87171", fontWeight: 600 }}>{r.word}×{r.count}</span>
                ))}
              </div>
              <button onClick={rewriteAvoidFw} disabled={!!loading} style={{ ...btn1, fontSize: 12, padding: "6px 14px", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", flexShrink: 0 }}>
                {loading || `${aiFor("forbidden").info.icon} AI 문맥 우회`}
              </button>
              {aiAttempts > 0 && <span style={{ fontSize: 10, color: "#6366f1" }}>AI {aiAttempts}회</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: 변경사항 (compact diff) ── */}
      {diffs.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>📝 변경 {diffs.length}줄</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
            {diffs.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.03)", fontSize: 12 }}>
                <span style={{ color: "#475569", minWidth: 28, flexShrink: 0 }}>L{d.line}</span>
                {d.orig && <span style={{ color: "#f87171", textDecoration: "line-through", opacity: 0.7, flex: 1 }}>{d.orig.substring(0, 80)}{d.orig.length > 80 ? "…" : ""}</span>}
                <span style={{ color: "#374151" }}>→</span>
                {d.fixed && <span style={{ color: "#16a34a", flex: 1 }}>{d.fixed.substring(0, 80)}{d.fixed.length > 80 ? "…" : ""}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  };


  // ── Images Step ──
  const renderImages = () => {
    const imgFw = forbidden.filter(f => f.isImageOnly);
    const content = fixedBlog || blog || "";
    const imgMarkers = [...content.matchAll(/\[이미지:\s*([^\]]+)\]/g)].map(m => m[1].trim());
    const hasGeminiKey = !!apiKeys.gemini;
    const genCount = imgSlots.filter(s => s.image).length;
    return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* AI picker for prompts */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>프롬프트 AI:</span>
        <AIPicker stepId="images" />
        <span style={{ fontSize: 11, color: "#475569" }}>| 이미지 생성: Gemini (슬롯별 선택)</span>
      </div>
      {(() => { const m = AI_MODELS[aiFor("images").provider]?.models.find(x => x.id === aiFor("images").model); return m ? <div style={{ fontSize: 11, color: "#475569" }}>💰 프롬프트 생성: {m.price}/M 토큰 {""} | 이미지: 슬롯별 모델 가격 참조</div> : null; })()}

      {/* Per-slot style setup + extra notes (before prompt generation) */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>🎨 이미지 설정</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>이미지 수:</span>
            {[3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => {
                setPreSlotCount(n);
                setPreSlotStyles(prev => {
                  const next = [...prev];
                  while (next.length < n) next.push("general");
                  return next.slice(0, n);
                });
              }} style={{
                width: 30, height: 30, borderRadius: 8, fontSize: 13, fontWeight: preSlotCount === n ? 700 : 500,
                border: `2px solid ${preSlotCount === n ? "#6366f1" : "rgba(0,0,0,0.08)"}`,
                background: preSlotCount === n ? "rgba(99,102,241,0.08)" : "#fff",
                color: preSlotCount === n ? "#6366f1" : "#64748b", cursor: "pointer",
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Per-slot style rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: preSlotCount }, (_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", minWidth: 50 }}>#{i + 1}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                {IMG_STYLES.map(s => (
                  <button key={s.id} onClick={() => setPreSlotStyles(prev => {
                    const next = [...prev]; next[i] = s.id; return next;
                  })} style={{
                    padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: (preSlotStyles[i] || "general") === s.id ? 700 : 400,
                    border: `1.5px solid ${(preSlotStyles[i] || "general") === s.id ? "#6366f1" : "rgba(0,0,0,0.06)"}`,
                    background: (preSlotStyles[i] || "general") === s.id ? "rgba(99,102,241,0.08)" : "transparent",
                    color: (preSlotStyles[i] || "general") === s.id ? "#6366f1" : "#94a3b8",
                    cursor: "pointer", transition: "all 0.1s",
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Extra notes */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>📝 추가 요청사항 (선택 — 비워두면 글 내용만으로 생성)</div>
          <textarea
            value={imgExtraNotes}
            onChange={e => setImgExtraNotes(e.target.value)}
            placeholder="예: 따뜻한 가족 분위기로 만들어줘 / 노인 관련 이미지 위주로 / 밝고 긍정적인 느낌"
            style={{ ...inp, minHeight: 50, fontSize: 13 }}
          />
        </div>
      </div>

      {/* Top controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ ...card, flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 280 }}>
          <button onClick={generateImages} disabled={!!loading || (!blog && !fixedBlog)} style={{ ...btn1, padding: "10px 18px", fontSize: 14, opacity: loading || (!blog && !fixedBlog) ? 0.4 : 1 }}>
            {loading && loading.includes("프롬프트") ? loading : `${aiFor("images").info.icon} 프롬프트 생성`}
          </button>
          {imgSlots.length > 0 && (
            <button onClick={genAllImages} disabled={!!loading || !hasGeminiKey} style={{ ...btn1, padding: "10px 18px", fontSize: 14, background: "linear-gradient(135deg,#4285f4,#34a853)", opacity: loading || !hasGeminiKey ? 0.4 : 1 }}>
              🔵 전체 이미지 생성 ({imgSlots.filter(s=>s.prompt).length}장)
            </button>
          )}
          {loading && <button onClick={stopAI} style={{ ...btn2, padding: "8px 14px", fontSize: 13, color: "#f87171" }}>⏹ 정지</button>}
        </div>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 8 }}>
          {!hasGeminiKey && <span style={{ fontSize: 12, color: "#f87171" }}>⚠️ Gemini 키 필요</span>}
          <button onClick={() => setShowSettings(true)} style={{ ...btnS, fontSize: 12 }}>⚙️ 설정</button>
          {imgSlots.length > 0 && <button onClick={addSlot} disabled={imgSlots.length >= 8} style={{ ...btnS, fontSize: 12, color: "#16a34a" }}>+ 슬롯 추가</button>}
          {(genCount > 0 || blog || fixedBlog) && <button onClick={saveAllToFolder} style={{ ...btn1, fontSize: 12, padding: "6px 14px", background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>📁 모두 저장 (글 + 이미지 {genCount}장)</button>}
          {imgSlots.length > 0 && (() => {
            const total = imgSlots.filter(s=>s.prompt).reduce((sum, s) => {
              const m = GEMINI_IMG_MODELS.find(x => x.id === s.imgModel) || GEMINI_IMG_MODELS[0];
              return sum + parseFloat(m.price.replace(/[^0-9.]/g, "") || "0.039");
            }, 0);
            return <span style={{ fontSize: 11, color: "#4285f4", padding: "2px 6px", borderRadius: 6, background: "rgba(66,133,244,0.06)" }}>
              예상: ${total.toFixed(3)} (≈₩{Math.round(total * 1450)})
            </span>;
          })()}
        </div>
      </div>

      {/* Forbidden word images info */}
      {(imgFw.length > 0 || imgMarkers.length > 0) && (
        <div style={{ ...card, background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", padding: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#c084fc", marginRight: 6 }}>🖼️ 금칙어 이미지:</span>
            {imgFw.map((f, i) => <span key={i} style={{ padding: "2px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(168,85,247,0.12)", color: "#c084fc" }}>{f.word}</span>)}
            {imgMarkers.map((m, i) => <span key={`m${i}`} style={{ padding: "2px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>{m}</span>)}
          </div>
        </div>
      )}

      {/* Image slots */}
      {imgSlots.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 40, color: "#475569" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
          <div style={{ fontSize: 14 }}>프롬프트 생성 버튼을 눌러 시작하세요</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>글 내용을 기반으로 AI가 이미지 프롬프트를 자동 생성합니다</div>
        </div>
      )}

      {imgSlots.map((slot, idx) => {
        const slotModel = GEMINI_IMG_MODELS.find(m => m.id === slot.imgModel) || GEMINI_IMG_MODELS[0];
        return (
        <div key={slot.id} style={{ ...card, padding: 0, overflow: "hidden" }}>
          {/* Slot header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.04)", flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>#{idx+1}</span>
              <input value={slot.position} onChange={e => updateSlot(slot.id, "position", e.target.value)} style={{ ...inp, padding: "3px 8px", fontSize: 12, width: 120, margin: 0 }} />
              <select value={slot.style} onChange={e => updateSlot(slot.id, "style", e.target.value)} style={{ ...inp, padding: "3px 8px", fontSize: 12, width: 110, margin: 0, cursor: "pointer" }}>
                {IMG_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <select value={slot.imgModel} onChange={e => updateSlot(slot.id, "imgModel", e.target.value)} style={{ ...inp, padding: "3px 8px", fontSize: 12, width: 180, margin: 0, cursor: "pointer", border: "1px solid rgba(66,133,244,0.2)" }}>
                {GEMINI_IMG_MODELS.map(m => <option key={m.id} value={m.id}>{m.label} — {m.price} {m.desc}</option>)}
              </select>
              <span style={{ fontSize: 10, color: "#4285f4", padding: "2px 5px", borderRadius: 6, background: "rgba(66,133,244,0.08)" }}>
                {slotModel.speed} {slotModel.priceKr}/장
              </span>
              <button onClick={() => updateSlot(slot.id, "hasText", !slot.hasText)} style={{
                padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none",
                background: slot.hasText ? "rgba(99,102,241,0.12)" : "rgba(0,0,0,0.04)",
                color: slot.hasText ? "#6366f1" : "#94a3b8",
              }}>
                {slot.hasText ? "가 한국어 포함" : "가 텍스트 없음"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => regenOnePrompt(slot.id)} disabled={!!loading} style={{ ...btnS, fontSize: 11, color: "#f59e0b", opacity: loading ? 0.4 : 1 }} title="프롬프트 재생성">
                🔄 프롬프트
              </button>
              <button onClick={() => genOneImage(slot)} disabled={slot.imgLoading || !slot.prompt} style={{ ...btnS, fontSize: 11, color: "#4285f4", opacity: slot.imgLoading || !slot.prompt ? 0.4 : 1 }}>
                {slot.imgLoading ? "생성중..." : "🔵 생성"}
              </button>
              {slot.imgLoading && <button onClick={stopAI} style={{ ...btnS, fontSize: 11, color: "#f87171" }}>⏹</button>}
              {slot.image && <button onClick={() => downloadImage(slot.image, `${getFilePrefix()}_이미지${String(idx+1).padStart(2,"0")}.png`)} style={{ ...btnS, fontSize: 11, color: "#16a34a" }}>💾</button>}
              <button onClick={() => removeSlot(slot.id)} style={{ ...btnS, fontSize: 11, color: "#f87171" }}>✕</button>
            </div>
          </div>

          {/* Left: prompt / Right: image */}
          <div style={{ display: "flex", minHeight: 180 }}>
            {/* Left — prompt */}
            <div style={{ flex: 1, padding: 12, borderRight: "1px solid rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea
                value={slot.prompt}
                onChange={e => updateSlot(slot.id, "prompt", e.target.value)}
                placeholder="English image prompt..."
                style={{ ...inp, flex: 1, fontSize: 13, lineHeight: 1.6, minHeight: 80, margin: 0 }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <input value={slot.alt} onChange={e => updateSlot(slot.id, "alt", e.target.value)} placeholder="alt 텍스트 (한글)" style={{ ...inp, flex: 1, padding: "4px 8px", fontSize: 12, margin: 0 }} />
                <button onClick={() => copyText(slot.prompt)} style={{ ...btnS, fontSize: 11 }}>📋</button>
              </div>
              {slot.purpose && <div style={{ fontSize: 11, color: "#475569" }}>📌 {slot.purpose}</div>}
              <div style={{ fontSize: 11, color: "#374151" }}>스타일: {IMG_STYLES.find(s=>s.id===slot.style)?.prompt?.substring(0,60)}...</div>
            </div>

            {/* Right — image */}
            <div style={{ flex: "0 0 220px", display: "flex", alignItems: "center", justifyContent: "center", padding: 10, background: "rgba(0,0,0,0.03)" }}>
              {slot.imgLoading ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 24, height: 24, border: "3px solid rgba(66,133,244,0.2)", borderTopColor: "#4285f4", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 12, color: "#4285f4" }}>생성 중...</div>
                </div>
              ) : slot.image ? (
                <img src={slot.image} alt={slot.alt || "blog image"} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6, cursor: "zoom-in" }} onClick={() => setLightboxImg(slot.image)} />
              ) : slot.imgError ? (
                <div style={{ textAlign: "center", padding: 10, maxWidth: 200 }}>
                  <div style={{ fontSize: 12, color: "#f87171", marginBottom: 6, lineHeight: 1.5, wordBreak: "break-word" }}>{slot.imgError}</div>
                  <button onClick={() => genOneImage(slot)} disabled={!hasGeminiKey} style={{ ...btnS, fontSize: 11, color: "#4285f4" }}>재시도</button>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#374151" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🖼️</div>
                  <div style={{ fontSize: 12 }}>이미지 미생성</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );})}
    </div>
  );};

  // ── Layout ──
  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EF", color: "#1e293b", fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />

      <div style={{ padding: "14px 20px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg,#818cf8,#c084fc,#fb7185)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>블로그 오토</h1>
            {/* Save & History */}
            <button onClick={saveSnapshot} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.06)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#16a34a" }}>
              💾 저장
            </button>
            <button onClick={() => setShowHistoryModal(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.06)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#6366f1" }}>
              📂 히스토리 ({history.length})
            </button>
            {/* Current AI indicator */}
            <button onClick={() => setShowSettings(true)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
              borderRadius: 20, border: `1px solid ${currentStepAI.info.color}30`, cursor: "pointer",
              background: `${currentStepAI.info.color}10`, transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 14 }}>{currentStepAI.info.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: currentStepAI.info.color }}>{currentStepAI.info.name}</span>
              <span style={{ fontSize: 11, color: "#64748b" }}>{(() => { const m = AI_MODELS[currentStepAI.provider]?.models.find(x => x.id === currentStepAI.model); return m ? m.label : currentStepAI.model; })()}</span>
              <span style={{ fontSize: 12, color: "#475569" }}>⚙️</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: 0, background: "rgba(0,0,0,0.05)", borderRadius: 10, padding: 3, border: "1px solid rgba(0,0,0,0.06)" }}>
            {STEPS.map((s, idx) => {
              const isActive = step === s.id;
              const isPast = STEPS.findIndex(x => x.id === step) > idx;
              return (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => setStep(s.id)} style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 500,
                  background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                  color: isActive ? "#6366f1" : isPast ? "#16a34a" : "#64748b",
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: isActive ? "rgba(99,102,241,0.2)" : isPast ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.06)", color: isActive ? "#6366f1" : isPast ? "#16a34a" : "#64748b" }}>
                    {isPast ? "✓" : idx + 1}
                  </span>
                  {s.icon} {s.label}
                </button>
                {idx < STEPS.length - 1 && <span style={{ color: "#334155", fontSize: 12, margin: "0 2px" }}>›</span>}
              </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 20px 36px", maxWidth: 1200, margin: "0 auto" }}>
        {step === "keywords" && renderKeywords()}
        {step === "write" && renderWrite()}
        {step === "forbidden" && renderForbidden()}
        {step === "images" && renderImages()}
      </div>

      {showSettings && renderSettings()}

      {/* Lightbox */}
      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={lightboxImg} alt="preview" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }} />
          <button onClick={e => { e.stopPropagation(); setLightboxImg(null); }} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div onClick={() => setShowHistoryModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, width: 550, maxHeight: "80vh", overflow: "auto", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📂 히스토리</h2>
              <div style={{ display: "flex", gap: 6 }}>
                {history.length > 0 && <button onClick={() => { if (confirm("전체 삭제?")) { setHistory([]); save("nv-history", []); } }} style={{ ...btnS, color: "#f87171" }}>전체 삭제</button>}
                <button onClick={() => setShowHistoryModal(false)} style={{ ...btnS, fontSize: 16 }}>✕</button>
              </div>
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                <div>저장된 히스토리가 없습니다</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>상단 💾 저장 버튼으로 현재 진행 상태를 저장하세요</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", cursor: "pointer", transition: "all 0.1s" }} onClick={() => loadSnapshot(h)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>{h.title || "제목 없음"}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {h.keyword && <span style={{ marginRight: 8 }}>🔑 {h.keyword}</span>}
                        {h.volume > 0 && <span style={{ marginRight: 8 }}>📊 {h.volume}</span>}
                        {h.imgCount > 0 && <span style={{ marginRight: 8 }}>🖼️ {h.imgCount}장</span>}
                        {h.body && <span style={{ color: "#94a3b8" }}>{h.body.substring(0, 40)}...</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "right", minWidth: 80 }}>
                      {h.timestamp ? new Date(h.timestamp).toLocaleDateString("ko") : ""}
                      <br />{h.timestamp ? new Date(h.timestamp).toLocaleTimeString("ko", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                    <button onClick={e => { e.stopPropagation(); setHistory(prev => { const next = prev.filter((_, j) => j !== i); save("nv-history", next); return next; }); }} style={{ ...btnS, fontSize: 10, color: "#f87171", padding: "2px 6px" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: "fixed", bottom: 16, right: 16, background: "rgba(255,255,255,0.95)", borderRadius: 8, padding: "8px 16px", border: `1px solid ${currentStepAI.info.color}40`, display: "flex", alignItems: "center", gap: 8, zIndex: 100 }}>
          <div style={{ width: 12, height: 12, border: `2px solid ${currentStepAI.info.color}40`, borderTopColor: currentStepAI.info.color, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: currentStepAI.info.color }}>{loading}</span>
          <button onClick={stopAI} style={{ ...btnS, fontSize: 12, padding: "2px 8px", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>⏹ 정지</button>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:3px} ::placeholder{color:#94a3b8} textarea:focus,input:focus{outline:none;border-color:rgba(99,102,241,0.4)!important}`}</style>
    </div>
  );
}

const card = { background: "#FFFFFF", borderRadius: 12, padding: 16, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };
const inp = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", background: "#FFFFFF", color: "#1e293b", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" };
const lbl = { display: "block", fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 };
const cc = { padding: "7px 5px", textAlign: "center", color: "#64748b", fontSize: 13 };
const btn1 = { padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 600 };
const btn2 = { padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer", background: "transparent", color: "#64748b", fontSize: 14 };
const btnS = { padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", background: "rgba(0,0,0,0.03)", color: "#64748b", fontSize: 12 };
