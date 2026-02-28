export function scoreKw(total, docs) {
  const ts = Math.max(0, 50 - Math.abs(total - 700) / 10);
  const rs = Math.max(0, 50 - (docs / Math.max(total, 1)) / 10);
  return Math.round((total < 300 || total > 1000 ? ts * 0.3 + rs : ts + rs) * 10) / 10;
}

export function grade(s) {
  if (s >= 70) return { l: "★★★", c: "#22c55e" };
  if (s >= 50) return { l: "★★", c: "#eab308" };
  if (s >= 30) return { l: "★", c: "#f97316" };
  return { l: "☆", c: "#64748b" };
}

export function parseBulk(text) {
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
}

export function parseTitles(text) {
  const titles = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const m = trimmed.match(/^(?:제목\s*(?:후보)?\s*)?(?:\d+[\.\)\:]|[①②③④⑤]|[-•])\s*(.+)/);
    if (m && m[1]) {
      const t = m[1].replace(/^[\s:：]+/, "").replace(/["""]/g, "").trim();
      if (t.length > 5 && t.length < 80 && !t.includes("본문") && !t.includes("태그")) titles.push(t);
    }
  }
  return titles.slice(0, 5);
}

export function stripTitleSection(text, titles) {
  let lines = text.split("\n");
  let startIdx = -1, endIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.match(/^(?:제목\s*(?:후보)?|##?\s*제목)/i) || (startIdx === -1 && titles.some(title => t.includes(title)))) {
      if (startIdx === -1) startIdx = i;
    }
    if (startIdx >= 0 && titles.some(title => t.includes(title))) endIdx = i;
  }
  if (startIdx >= 0 && endIdx >= 0) {
    let cutEnd = endIdx + 1;
    while (cutEnd < lines.length && lines[cutEnd].trim() === "") cutEnd++;
    lines.splice(startIdx, cutEnd - startIdx);
  }
  while (lines.length && lines[0].trim() === "") lines.shift();
  return lines.join("\n");
}

export function stripAiAnalysis(text) {
  let cleaned = (text || "").replace(/^⚠️\s*\S+\s*접속\s*불가\s*→\s*Claude로\s*자동\s*전환됨\s*\n*/i, "").trim();
  const lines = cleaned.split("\n");
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const l = lines[i].trim();
    if (l.match(/^(글을\s*분석|분석\s*결과|다음|아래|수정|변경|금칙어를?\s*찾|발견|확인|처리)/)) { startIdx = i + 1; continue; }
    if (l.match(/^\d+\.\s*\*\*["""]/) || l.match(/^\d+\.\s*["""]/) || l.match(/^[-•]\s*\*\*/)) { startIdx = i + 1; continue; }
    if (l === "" && startIdx > 0 && startIdx === i) { startIdx = i + 1; continue; }
    break;
  }
  let endIdx = lines.length;
  for (let i = lines.length - 1; i > startIdx; i--) {
    const l = lines[i].trim();
    if (l.match(/^(위|이상|모든|금칙어.*제거|수정.*완료|변경.*사항)/)) { endIdx = i; continue; }
    if (l === "" && endIdx < lines.length && endIdx === i + 1) { endIdx = i; continue; }
    break;
  }
  return lines.slice(startIdx, endIdx).join("\n").trim();
}

export function parseFwPaste(text) {
  const results = [];
  const clean = text.trim();
  if (!clean) return results;
  const lines = clean.split("\n").filter(l => l.trim());
  if (lines.length > 1) {
    for (const line of lines) {
      const parts = line.split(/\t+/);
      if (parts.length >= 2) {
        const word = parts[0].trim();
        const count = parseInt(parts[1]);
        if (word && !isNaN(count) && word !== "금칙어") results.push({ word, count });
      }
    }
    if (results.length > 0) return results;
  }
  if (clean.includes("\t")) {
    const tabParts = clean.split("\t");
    for (let i = 0; i < tabParts.length; i++) {
      const part = tabParts[i].trim();
      if (!part) continue;
      const numMatch = part.match(/^(\d+)\s*(.*)/);
      if (numMatch && results.length > 0) {
        results[results.length - 1].count = parseInt(numMatch[1]);
        const nextWord = numMatch[2].trim();
        if (nextWord && /[가-힣]/.test(nextWord)) results.push({ word: nextWord, count: 1 });
      } else if (/[가-힣]/.test(part)) {
        const embedded = part.match(/^([가-힣][가-힣\s]*?)(\d+)$/);
        if (embedded) results.push({ word: embedded[1].trim(), count: parseInt(embedded[2]) });
        else results.push({ word: part, count: 1 });
      }
    }
    if (results.length > 0) return results.filter(r => r.word && r.word !== "금칙어");
  }
  const stripped = clean.replace(/^금칙어\s*건수/, "").replace(/[×x]/gi, "");
  const matches = [...stripped.matchAll(/([가-힣](?:[가-힣\s]*[가-힣])?)[\s]*(\d+)/g)];
  for (const m of matches) {
    const word = m[1].trim();
    const count = parseInt(m[2]);
    if (word && word !== "금칙어") results.push({ word, count });
  }
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
}

export function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    });
  } else {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
  }
}
