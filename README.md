# IPO Master

국내 공모주 일정과 수요예측·청약 경쟁률·상장 성과를 한곳에서 확인하는 데이터 대시보드입니다.

[서비스 바로가기](https://bsjuun2026.mycafe24.com/ipomaster/)

## 주요 기능

- 공모주 청약·환불·상장 일정을 캘린더와 목록으로 제공
- 확정 공모가, 희망 공모가, 기관 경쟁률 등 핵심 지표 요약
- 종목별 상세 정보와 참여 판단을 돕는 분석 화면
- 과거 상장 종목의 공모가 대비 시초가·종가 수익률 분석
- 청약 경쟁률 수동 보정과 데이터 재집계
- 데이터 갱신, 정적 빌드, Cafe24 배포 및 Telegram 알림 자동화

## 기술 스택

- Next.js 14 / React 18 / TypeScript
- Tailwind CSS / Lucide React
- Cheerio / Playwright / Axios
- GitHub Actions / Cafe24 FTP

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 주요 명령어

```bash
npm run data:update       # 공모주 데이터 수집 및 집계
npm run override:apply    # 경쟁률 보정 데이터 반영
npm run generate:summary # 일정 요약 생성
npm run build             # 정적 사이트 빌드
```

일부 데이터 수집과 운영 기능에는 별도의 환경 변수가 필요합니다. 비밀 값은 저장소에 커밋하지 마세요.

## 안내

이 프로젝트는 정보 제공을 위한 개인 프로젝트이며 투자 권유를 목적으로 하지 않습니다.
