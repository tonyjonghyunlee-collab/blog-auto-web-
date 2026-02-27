import crypto from "crypto";

// 네이버 검색광고 API 프록시 (BYOK)
export async function POST(request) {
  try {
    const body = await request.json();
    const { keywords } = body;

    // BYOK: 브라우저에서 전달된 키 우선, 없으면 환경변수
    const customerId = body.customerId || process.env.NAVER_CUSTOMER_ID;
    const apiKey = body.apiKey || process.env.NAVER_API_KEY;
    const secretKey = body.secretKey || process.env.NAVER_SECRET_KEY;

    if (!customerId || !apiKey || !secretKey) {
      return Response.json(
        { error: "네이버 API 키가 없습니다. ⚙️ 설정에서 입력하세요." },
        { status: 400 }
      );
    }

    const timestamp = String(Date.now());
    const method = "GET";
    const path = "/keywordstool";

    const hmac = crypto.createHmac("sha256", secretKey);
    hmac.update(`${timestamp}.${method}.${path}`);
    const signature = hmac.digest("base64");

    const kwStr = encodeURIComponent(
      Array.isArray(keywords) ? keywords.join(",") : keywords
    );
    const url = `https://api.searchad.naver.com${path}?hintKeywords=${kwStr}&showDetail=1`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": apiKey,
        "X-Customer": customerId,
        "X-Signature": signature,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: `네이버 API ${res.status}: ${text}` }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: `서버 오류: ${err.message}` }, { status: 500 });
  }
}
