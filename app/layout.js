export const metadata = {
  title: "블로그 오토 — AI 블로그 자동화",
  description: "네이버 블로그 SEO 최적화 자동화 도구",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, background: "#FAF6EF" }}>
        {children}
      </body>
    </html>
  );
}
