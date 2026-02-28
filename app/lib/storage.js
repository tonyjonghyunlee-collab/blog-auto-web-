export async function load(k, fb) {
  try {
    if (typeof window === "undefined") return fb;
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : fb;
  } catch { return fb; }
}

export async function save(k, d) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(k, JSON.stringify(d));
  } catch {}
}
