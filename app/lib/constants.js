export const STEPS = [
  { id: "keywords", label: "키워드", icon: "🔍" },
  { id: "write", label: "글 작성", icon: "✍️" },
  { id: "forbidden", label: "금칙어", icon: "🚫" },
  { id: "images", label: "이미지", icon: "🎨" },
];

export const AI_MODELS = {
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

export const WRITE_STYLES = [
  { id: "clickbait", label: "🎣 낚시형", desc: "호기심 자극, 궁금증 유발, 클릭을 부르는 제목과 도입", color: "#f59e0b",
    prompt: "- 제목은 클릭 유발. \"이것 모르면 손해\", \"아직도 이렇게 하세요?\" 패턴\n- 도입부: 독자가 \"이건 나 이야기\"라고 느끼게\n- 핵심 정보를 바로 주지 말고 궁금증 쌓기\n- \"그런데 여기서 중요한 건요...\" 전환으로 계속 읽게" },
  { id: "story", label: "📖 스토리텔링", desc: "실제 경험담처럼, 감정 공감, 자연스러운 흐름", color: "#8b5cf6",
    prompt: "- \"저도 처음에는 몰랐어요\" 1인칭 경험담\n- 감정 흐름: 걱정 → 알아봄 → 해결 → 안심\n- 실제 사례 활용 (가상이어도 현실적)" },
  { id: "info", label: "📊 정보전달", desc: "체계적 분석, 객관적 비교, 전문가 톤", color: "#3b82f6",
    prompt: "- 객관적 전문가 톤\n- 구체적 수치, 비교표, 조건 활용\n- \"첫째, 둘째\" 구조적 전개" },
  { id: "compare", label: "⚖️ 비교분석", desc: "A vs B 구조, 장단점, 어떤 게 나에게 맞는지", color: "#ec4899",
    prompt: "- \"A와 B, 뭐가 다를까?\" 비교 구조\n- 장단점 공정 비교\n- \"이런 분은 A, 저런 분은 B\" 결론" },
  { id: "problem", label: "🔧 문제해결", desc: "고민 제시 → 원인 → 해결법, 실용 팁 중심", color: "#10b981",
    prompt: "- \"혹시 이런 고민 있으신가요?\" 시작\n- 원인 설명 → 해결 방법 제시\n- 실행 가능한 액션 아이템" },
  { id: "listicle", label: "📋 리스트형", desc: "5가지 방법, 3가지 이유 등 숫자 기반 구성", color: "#f97316",
    prompt: "- 제목에 숫자: \"알아야 할 5가지\"\n- 각 항목 소제목으로 정리\n- 마지막 항목을 가장 강력하게" },
];

export const PERSONAS = [
  { id: "experience", label: "👤 경험자", desc: "직접 겪은 사람의 후기", prompt: "나는 이 주제를 직접 경험한 사람입니다. 1인칭 시점으로, 처음 알아볼 때의 막막함 → 비교 과정 → 최종 선택 → 결과까지 실제 경험담처럼 써주세요." },
  { id: "expert", label: "🎓 전문가", desc: "업계 종사자의 분석", prompt: "나는 이 분야 10년 이상 전문가입니다. 업계 내부자만 아는 정보, 흔한 실수, 숨겨진 팁을 공유하세요." },
  { id: "parent", label: "👨‍👩‍👦 부모/가족", desc: "가족을 위해 알아보는 관점", prompt: "나는 가족을 위해 이 주제를 알아보는 사람입니다. 걱정과 사랑이 담긴 톤으로 써주세요." },
  { id: "beginner", label: "🌱 초보자", desc: "처음 알아보는 사람의 시선", prompt: "나는 초보자입니다. 어려운 용어를 쉽게 풀어주고, 함께 배워가는 느낌으로 써주세요." },
  { id: "none", label: "📝 중립", desc: "페르소나 없이 객관적 서술", prompt: "" },
];

export const HOOKS = [
  { id: "question", label: "❓ 질문형", desc: "궁금증 유발", prompt: "도입부를 강렬한 질문으로 시작하세요. '혹시 ~한 경험 있으신가요?'" },
  { id: "shock", label: "⚡ 반전형", desc: "예상 깨는 사실", prompt: "도입부에 놀라운 사실이나 통계로 시작. '사실 ~의 70%는 ~라는 걸 아시나요?'" },
  { id: "empathy", label: "🤝 공감형", desc: "독자의 고민에 공감", prompt: "독자의 현재 고민을 정확히 짚어주세요. '요즘 ~때문에 고민이 많으시죠?'" },
  { id: "story", label: "📖 이야기형", desc: "에피소드로 시작", prompt: "짧은 에피소드로 시작. '지난달, ~을 하다가 깜짝 놀란 일이 있었어요'" },
  { id: "none", label: "✍️ 자유", desc: "AI 자율 결정", prompt: "" },
];

export const IMG_STYLES = [
  { id: "general", label: "🖼️ 일반", prompt: "Clean, professional blog illustration, soft colors, modern design" },
  { id: "table", label: "📊 표/설명형", prompt: "Infographic style with visual data representation, no text, icons and diagrams" },
  { id: "compare", label: "⚖️ 비교형", prompt: "Split comparison layout, two sides showing different options, visual contrast" },
  { id: "process", label: "🔄 프로세스", prompt: "Step by step process flow, visual journey, numbered icons without text" },
  { id: "person", label: "👤 인물/감성", prompt: "Warm emotional scene, person in everyday life situation, cozy atmosphere" },
  { id: "icon", label: "🎯 아이콘형", prompt: "Flat design icon illustration, minimalist, single concept, vibrant colors" },
  { id: "photo", label: "📷 사진풍", prompt: "Photorealistic, high quality stock photo style, natural lighting" },
  { id: "hand", label: "✏️ 손그림풍", prompt: "Hand-drawn sketch style, warm pencil illustration, friendly casual feel" },
];

export const GEMINI_IMG_MODELS = [
  { id: "gemini-3.1-flash-image-preview", label: "Nano Banana 2 🍌🍌", desc: "4K·Pro급 화질·빠름·추천", price: "~$0.04/장", priceKr: "≈₩58", speed: "⚡빠름" },
  { id: "gemini-3-pro-image-preview", label: "Nano Banana Pro 🍌★", desc: "4K·최고화질·정밀", price: "~$0.07/장", priceKr: "≈₩100", speed: "🐢느림" },
  { id: "gemini-2.5-flash-image", label: "Nano Banana 🍌", desc: "네이티브 이미지·가성비", price: "$0.039/장", priceKr: "≈₩57", speed: "⚡빠름" },
  { id: "gemini-2.0-flash-preview-image-generation", label: "2.0 Flash 이미지", desc: "안정적·구버전", price: "$0.039/장", priceKr: "≈₩57", speed: "⚡빠름" },
];

export const PHRASE_REPLACE = {
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

export const COMMON_REPLACE = {
  "가입": "준비", "세요": "습니다", "상담": "문의",
  "하시": "하여", "전화": "연락", "고민": "걱정", "시기": "시점", "각하": "줄이",
  "무료": "부담 없는", "추천": "안내", "비교": "살펴보기", "견적": "예상 금액",
  "보장": "지원 범위", "해약": "중도 해지", "보험료": "월 납입금", "보험금": "지급금",
  "약관": "계약 내용", "야 하": "어야 하", "드립니다": "겠습니다", "드려요": "겠습니다",
  "해드": "도와", "진행": "안내", "혜택": "장점", "비하": "대비하",
};

export const DEFAULT_STEP_AI = {
  write: { provider: "gemini", model: "gemini-3-flash-preview" },
  forbidden: { provider: "gemini", model: "gemini-3-flash-preview" },
  images: { provider: "gemini", model: "gemini-3-flash-preview" },
};

export const card = { background: "#FFFFFF", borderRadius: 12, padding: 16, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };
export const inp = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", background: "#FFFFFF", color: "#1e293b", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" };
export const lbl = { display: "block", fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 };
export const cc = { padding: "7px 5px", textAlign: "center", color: "#64748b", fontSize: 13 };
export const btn1 = { padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 600 };
export const btn2 = { padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer", background: "transparent", color: "#64748b", fontSize: 14 };
export const btnS = { padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", background: "rgba(0,0,0,0.03)", color: "#64748b", fontSize: 12 };
