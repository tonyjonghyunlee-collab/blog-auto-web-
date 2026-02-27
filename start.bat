@echo off
chcp 65001 >nul
title 블로그 오토 서버

echo.
echo  ======================================
echo        블로그 오토 v3 서버
echo  ======================================
echo.

cd /d "%~dp0"

:: 1. Node.js 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [에러] Node.js가 없습니다!
    echo  https://nodejs.org 에서 LTS 설치 후 재실행
    pause
    exit /b
)
for /f "tokens=*" %%i in ('node --version') do echo  [OK] Node.js %%i

:: 2. .env.local 확인
if not exist ".env.local" (
    if exist ".env.example" (
        copy .env.example .env.local >nul
        echo  [!] .env.local 생성됨 - API 키를 입력하세요
        notepad .env.local
        echo  입력 후 아무키나 누르세요...
        pause >nul
    ) else (
        echo  [에러] .env.example 파일 없음
        pause
        exit /b
    )
)
echo  [OK] .env.local 확인

:: 3. 패키지 설치
if not exist "node_modules" (
    echo  [..] 패키지 설치 중 (1-2분)...
    call npm install
    if %errorlevel% neq 0 (
        echo  [에러] npm install 실패
        pause
        exit /b
    )
    echo  [OK] 설치 완료
) else (
    echo  [OK] node_modules 확인
)

:: 4. .next 캐시 삭제
if exist ".next" (
    rmdir /s /q .next 2>nul
    echo  [OK] 빌드 캐시 초기화
)

echo.
echo  ======================================
echo   서버 시작 중... 잠시 기다려주세요
echo   준비되면 브라우저가 자동으로 열립니다
echo  ======================================
echo   수동 접속: http://localhost:3000
echo   종료: Ctrl+C
echo  ======================================
echo.

:: 5. 브라우저 자동 열기 (10초 대기)
start /b cmd /c "timeout /t 10 /nobreak >nul && start http://localhost:3000" 2>nul

:: 6. 서버 실행
call npm run dev

echo.
echo  서버가 종료되었습니다.
pause
