import { WRITE_STYLES, PERSONAS, HOOKS, IMG_STYLES } from "./constants";

// P1-5: 키워드 20개로 축소 + 검색 의도 기반
export function buildKeywordPrompt(seedKw) {
  return `"${seedKw}" 관련 검색 키워드 20개를 생성해.

## 규칙
- "${seedKw}+단어" 변형: 최대 5개
- 같은 검색 의도를 가진 다른 짧은 키워드: 15개 (1~3단어)
- 한 단어 키워드를 우선 포함

## 좋은 예시 ("노인보험")
변형: 노인보험 추천, 노인보험 비교, 노인보험 가입나이, 노인보험 보장, 노인보험료
관련: 실손보험, 치매보험, 간병보험, 암보험, 효도보험, 시니어보험, 건강보험, 의료실비, 종합보험, 정기보험, 종신보험, 입원비, 장기요양, 노후준비, 연금보험

한 줄에 키워드 하나만, 번호 없이 출력. 총 20개.`;
}

// P1-4: 글쓰기 프롬프트 간결화
export function buildWritePrompt({ mainKeyword, subKw, topic, target, contact, briefing, writeStyle, persona, hookStyle, forbidden }) {
  const style = WRITE_STYLES.find(s => s.id === writeStyle);
  const personaObj = PERSONAS.find(p => p.id === persona);
  const hookObj = HOOKS.find(h => h.id === hookStyle);

  const briefingSection = briefing?.trim() ? `\n## 핵심 내용 (이 내용 중심으로 구성)\n${briefing}` : "";
  const personaSection = personaObj?.prompt ? `\n## 페르소나\n${personaObj.prompt}` : "";
  const hookSection = hookObj?.prompt ? `\n## 도입부\n${hookObj.prompt}` : "";
  const fwSection = buildFwSection(forbidden);

  return `네이버 블로그 상위 노출 글을 작성하세요.

## 정보
- 메인 키워드: ${mainKeyword}
- 서브 키워드: ${subKw}
- 주제: ${topic}
- 타겟: ${target}
${contact ? `- 연락처: ${contact}` : ""}
${briefingSection}
${personaSection}
${hookSection}

## 스타일: ${style?.label || "낚시형"}
${style?.prompt || ""}

## SEO 규칙
1. 제목 3개: 호기심 유발 + 키워드 자연 포함, 15-30자
2. 도입: 공감 포인트로 시작. "안녕하세요~ 오늘은" 패턴 금지
3. 본문: 소제목 3-4개, 각 3-4문단. 정보→해석→독자 적용 패턴
4. CTA: 마지막 단락에서만 부드럽게
5. 태그 10-15개
${fwSection}

## 출력
제목 후보 3개 (번호) → 빈 줄 → 본문 → 빈 줄 → 태그

## 금지
- "안녕하세요" 시작, 소제목 키워드 나열, ** 남용, 키워드 반복, "~입니다"만 반복`;
}

function buildFwSection(forbidden) {
  if (!forbidden?.length) return "";
  const textFw = forbidden.filter(f => !f.isImageOnly);
  const imgFw = forbidden.filter(f => f.isImageOnly);
  if (!textFw.length && !imgFw.length) return "";

  let section = "\n\n## 금칙어 (절대 사용 금지)";
  if (textFw.length) {
    section += "\n텍스트 금칙어:";
    for (const f of textFw) {
      section += f.replacement ? `\n- "${f.word}" → "${f.replacement}"` : `\n- "${f.word}" → 다른 표현`;
    }
  }
  if (imgFw.length) {
    section += "\n이미지 전용 (텍스트 금지, [이미지: 설명]으로 대체):";
    for (const f of imgFw) section += `\n- "${f.word}"`;
  }
  section += "\n※ 제목에도 금칙어 금지!";
  return section;
}

// P1-6: 이미지 프롬프트 현실화
export function buildImagePrompt({ slotCount, slotStyleGuide, content, imgFw, imgMarkers, imgExtraNotes }) {
  return `블로그 글에 삽입할 이미지 ${slotCount}개의 프롬프트를 JSON 배열로 만드세요.

## 스타일 (각각 다름)
${slotStyleGuide}

## 프롬프트 작성 규칙
- 이미지 1,2: 한국어 단어 2-3개까지만 포함 가능 (짧은 라벨만. 문장 금지)
  예: "비교", "핵심", "추천" 정도. 긴 텍스트는 깨짐
- 이미지 3 이후: 텍스트 없이 분위기/비주얼만
- 각 프롬프트는 150자 이내로 간결하게
- 구조: "Style: [스타일]. Subject: [주제]. Mood: [분위기]. Colors: [색상]."
${imgFw?.length ? `\n금칙어 이미지: ${imgFw.map(f=>f.word).join(", ")}` : ""}
${imgMarkers?.length ? `\n본문 마커: ${imgMarkers.join(", ")}` : ""}
${imgExtraNotes?.trim() ? `\n추가: ${imgExtraNotes.trim()}` : ""}

글:
${content.substring(0, 2500)}

JSON 형식으로만 출력:
[
  {"position":"소제목1 아래","prompt":"Style: infographic. Subject: 핵심 비교. Mood: clean. Colors: blue, white.","alt":"한글 alt","purpose":"목적","hasText":true},
  {"position":"소제목2 아래","prompt":"Style: comparison. Subject: 두 옵션 대비. Mood: professional.","alt":"alt","purpose":"목적","hasText":true},
  {"position":"소제목3 아래","prompt":"Style: emotional. Subject: warm scene. Mood: cozy. No text.","alt":"alt","purpose":"목적","hasText":false}
]`;
}

export function buildRegenPrompt({ slot, content }) {
  const styleInfo = IMG_STYLES.find(s => s.id === slot.style) || IMG_STYLES[0];
  return `이미지 1개 프롬프트를 만드세요.
위치: "${slot.position}"
스타일: ${styleInfo.label} — ${styleInfo.prompt}
${slot.hasText ? "한국어 단어 2-3개만 포함 (짧은 라벨만)." : "텍스트 없이 비주얼만."}
기존 참고: ${slot.prompt}
목적: ${slot.purpose || slot.alt || ""}

글 요약:
${content.substring(0, 1500)}

JSON으로만 출력:
{"prompt":"150자 이내","alt":"한글 alt","purpose":"한글 목적"}`;
}

export function buildFwRewritePrompt({ fwDetail, linePrompts }) {
  return `금칙어가 포함된 문장들을 수정해주세요.

금칙어: ${fwDetail}

## 수정 대상
${linePrompts}

## 규칙
- 금칙어만 다른 표현으로 교체
- 문장 길이 ±10자 이내 유지
- 구조/어미/톤 유지
- <br>, [이미지:...] 마커 보존

## 출력 (이 형식으로만!)
[0] 수정된 문장
[1] 수정된 문장
...`;
}

export function buildSmoothPrompt(text) {
  return `아래 글에서 기계적으로 단어를 치환한 부분이 어색합니다.
자연스럽게 다듬어 주세요. 내용/구조/길이 유지. 설명 없이 수정된 글만 출력.

${text}`;
}

export function buildRetryFwPrompt({ stillRemain, retryPrompts }) {
  return `아직 금칙어가 남았습니다. 반드시 제거하세요.

금칙어: ${stillRemain.map(r => `"${r.word}"`).join(", ")}

${retryPrompts}

규칙: 금칙어만 교체. 길이 유지. [번호] 수정문장 형식으로만 출력.`;
}
