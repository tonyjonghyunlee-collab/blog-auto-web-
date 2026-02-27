# 블로그 오토 — 웹 배포 가이드 (A to Z)

> 초보자도 따라할 수 있게 모든 단계를 설명합니다.
> 소요 시간: 약 20~30분

---

## 전체 흐름

```
1. 필요한 프로그램 설치 (Node.js, Git)
2. 프로젝트 폴더 다운로드
3. API 키 발급 (네이버, Claude 등)
4. 로컬에서 테스트
5. GitHub에 업로드
6. Vercel에서 무료 배포
7. 완료! → https://내이름.vercel.app 에서 사용
```

---

## STEP 1. 필요한 프로그램 설치

### 1-1. Node.js 설치
- https://nodejs.org 접속
- **LTS (권장 버전)** 다운로드 → 설치 (모두 기본값으로 Next)
- 설치 확인: 터미널(명령프롬프트) 열고 입력
```bash
node --version    # v20.x.x 이상이면 OK
npm --version     # 10.x.x 이상이면 OK
```

### 1-2. Git 설치
- https://git-scm.com 접속 → 다운로드 → 설치 (기본값으로)
- 설치 확인:
```bash
git --version     # git version 2.x.x 이면 OK
```

### 1-3. VS Code 설치 (선택, 권장)
- https://code.visualstudio.com → 다운로드 → 설치
- 코드 편집할 때 편리합니다

---

## STEP 2. 프로젝트 다운로드 & 설정

### 2-1. Claude에서 다운로드한 파일 풀기

Claude에서 다운로드한 `blog-auto-web.zip` 파일을 원하는 위치에 풀어주세요.

### 2-2. 터미널에서 프로젝트 폴더로 이동
```bash
cd blog-auto-web
```

### 2-3. 필요한 패키지 설치
```bash
npm install
```
→ `node_modules` 폴더가 생기면 성공!

### 2-4. 환경 변수 파일 만들기
```bash
# Mac/Linux
cp .env.example .env.local

# Windows (명령프롬프트)
copy .env.example .env.local
```

---

## STEP 3. API 키 발급

### 3-1. 네이버 검색광고 API (★ 가장 중요)

1. https://searchad.naver.com 접속 → 로그인
2. 상단 메뉴 → **도구** → **API 사용 관리**
3. 화면에 보이는 3가지를 메모:
   - **API 라이선스 (CUSTOMER_ID)**: 숫자
   - **액세스 라이선스 (API_KEY)**: 영문+숫자
   - **비밀키 (SECRET_KEY)**: 영문+숫자

4. `.env.local` 파일을 열어서 입력:
```
NAVER_CUSTOMER_ID=여기에숫자입력
NAVER_API_KEY=여기에영문숫자입력
NAVER_SECRET_KEY=여기에영문숫자입력
```

> ⚠️ 등호(=) 앞뒤에 공백 없이! 따옴표도 붙이지 마세요

### 3-2. Claude API (선택)

1. https://console.anthropic.com 접속 → 회원가입
2. **API Keys** → **Create Key** 클릭 → 키 복사
3. `.env.local`에 입력:
```
CLAUDE_API_KEY=sk-ant-api03-여기에키입력
```

> 💡 Claude API는 유료입니다 ($3/1M 토큰 ~= 글 200편 정도)
> 아티팩트에서는 무료였지만 웹 배포 시에는 비용이 발생합니다

### 3-3. Gemini API (선택, 이미지 생성용)

1. https://aistudio.google.com/apikey 접속 → Google 로그인
2. **Create API Key** 클릭 → 키 복사
3. `.env.local`에 입력:
```
GEMINI_API_KEY=AIza여기에키입력
```

> 💡 Gemini는 무료 할당량이 있어서 적당히 쓰면 무료!

### 3-4. OpenAI GPT API (선택)

1. https://platform.openai.com/api-keys 접속
2. **Create new secret key** → 키 복사
3. `.env.local`에 입력:
```
OPENAI_API_KEY=sk-여기에키입력
```

---

## STEP 4. 로컬에서 테스트

```bash
npm run dev
```

→ 터미널에 이렇게 나오면 성공:
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
```

**브라우저에서 http://localhost:3000 접속!**

- 키워드 입력 → 🔍 조회 버튼 → 검색량이 나오면 네이버 API 성공! 🎉
- 글 작성 → Claude로 생성 → 글이 나오면 Claude API 성공! 🎉

> 문제가 있으면 터미널에 에러 메시지가 나옵니다.
> `.env.local` 파일의 키 값을 다시 확인해보세요.

테스트 끝나면 `Ctrl+C`로 서버 종료.

---

## STEP 5. GitHub에 업로드

### 5-1. GitHub 계정 만들기 (없으면)
- https://github.com → Sign up

### 5-2. 새 저장소 만들기
1. GitHub 우측 상단 **+** → **New repository**
2. Repository name: `blog-auto` (원하는 이름)
3. **Private** 선택 (⚠️ API 키가 코드에 없으니 Public도 괜찮지만 Private 추천)
4. **Create repository** 클릭

### 5-3. 코드 업로드
터미널에서 프로젝트 폴더에서:
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/내아이디/blog-auto.git
git push -u origin main
```

> `내아이디`를 본인 GitHub 아이디로 바꾸세요!
> 로그인 팝업이 나오면 GitHub 계정으로 로그인

---

## STEP 6. Vercel에서 무료 배포

### 6-1. Vercel 가입
- https://vercel.com → **Sign Up** → **Continue with GitHub** 클릭
- GitHub 계정으로 연동

### 6-2. 프로젝트 가져오기
1. Vercel 대시보드 → **Add New...** → **Project**
2. GitHub 저장소 목록에서 `blog-auto` 선택 → **Import**
3. **Framework Preset**: Next.js (자동 감지됨)
4. **Environment Variables** 섹션 열기 ← ⚠️ 이거 중요!!

### 6-3. 환경 변수 입력 (가장 중요!)

하나씩 추가:

| Name | Value |
|------|-------|
| `NAVER_CUSTOMER_ID` | (3-1에서 메모한 값) |
| `NAVER_API_KEY` | (3-1에서 메모한 값) |
| `NAVER_SECRET_KEY` | (3-1에서 메모한 값) |
| `CLAUDE_API_KEY` | (3-2에서 복사한 값) |
| `GEMINI_API_KEY` | (3-3에서 복사한 값) |
| `OPENAI_API_KEY` | (3-4에서 복사한 값, 없으면 생략) |

> 한 줄씩 Name에 이름, Value에 값 입력 → **Add** 클릭

### 6-4. 배포!
- **Deploy** 클릭
- 1~2분 기다리면 완료!
- `https://blog-auto-xxxx.vercel.app` 같은 URL이 나옵니다

🎉 **이 URL로 접속하면 블로그 오토가 웹에서 동작합니다!**

---

## STEP 7. 나중에 수정할 때

### Claude에서 수정한 파일 적용하기
1. Claude에서 수정한 `blog-automation-v3.jsx` 다운로드
2. 프로젝트 폴더의 `app/BlogAuto.jsx`에 덮어쓰기
   - 단, 파일 맨 위에 `"use client";` 가 있는지 확인
   - API 호출 함수들이 `/api/xxx` 프록시를 사용하는지 확인
3. Git으로 업로드:
```bash
git add .
git commit -m "update blog component"
git push
```
4. Vercel이 자동으로 재배포합니다 (1~2분)

### 환경 변수 수정
- Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
- 수정 후 **Redeploy** 필요 (Deployments 탭 → 최근 배포 → ... → Redeploy)

---

## 프로젝트 구조 설명

```
blog-auto-web/
├── app/
│   ├── api/                    ← 서버 API 라우트 (프록시)
│   │   ├── naver/route.js      ← 네이버 검색광고 API 중계
│   │   ├── claude/route.js     ← Claude API 중계
│   │   ├── gpt/route.js        ← GPT API 중계
│   │   ├── gemini/route.js     ← Gemini 텍스트 API 중계
│   │   └── gemini-image/route.js ← Gemini 이미지 API 중계
│   ├── BlogAuto.jsx            ← 블로그 오토 메인 컴포넌트
│   ├── layout.js               ← HTML 기본 구조
│   └── page.js                 ← 메인 페이지
├── public/                     ← 정적 파일 (favicon 등)
├── .env.example                ← 환경변수 예시
├── .env.local                  ← 실제 API 키 (Git에 안 올라감!)
├── .gitignore                  ← Git 제외 목록
├── next.config.js              ← Next.js 설정
└── package.json                ← 의존성 목록
```

### 왜 이렇게 하나요?

```
아티팩트 (전):
  브라우저 ──→ 네이버 API  ❌ CORS 차단
  브라우저 ──→ Claude API   ✅ (특수 처리)
  API 키가 브라우저에 노출  ⚠️ 보안 위험

웹 배포 (후):
  브라우저 ──→ /api/naver ──→ 네이버 API  ✅ 서버에서 호출 = CORS 없음
  브라우저 ──→ /api/claude ──→ Claude API  ✅
  API 키는 서버에만 있음  ✅ 보안 안전
```

---

## 자주 묻는 질문

**Q: 비용이 드나요?**
- Vercel 무료 플랜: 월 100GB 트래픽, 개인 사용 충분
- 네이버 API: 무료
- Claude API: 유료 (글 1편 ≈ $0.01~0.03, 월 100편 ≈ $1~3)
- Gemini API: 무료 할당량 있음

**Q: 다른 사람도 접속할 수 있나요?**
- URL을 아는 사람은 누구나 접속 가능
- 본인만 쓰려면 Vercel 비밀번호 보호 설정 (유료)
- 또는 접속 인증을 코드에 추가

**Q: 도메인을 바꿀 수 있나요?**
- Vercel 대시보드 → Settings → Domains
- 커스텀 도메인 연결 가능 (예: blog.mydomain.com)

**Q: 에러가 나요!**
- 터미널에서 `npm run dev`로 로컬 테스트 먼저
- `.env.local` 파일 키 값 확인 (공백, 따옴표 없이)
- Vercel 대시보드 → Logs 탭에서 에러 확인
