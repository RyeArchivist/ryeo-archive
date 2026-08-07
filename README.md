# 慮 記錄網 · MASTER README

CURRENT VERSION: v13.4 INLINE ATTACH + TRIAD HANJA MASTER
UPDATED: 2026-08-08

## 프로젝트 개요

Cloudflare Pages + Functions + D1 기반 려(慮) 기록망.
관리자 페이지에서 사건 기록을 작성/수정하고,
공개 상태의 사건만 일반 사이트에서 열람합니다.

현재 공개 기록 수와 별개로 사이트의 전체 색인은 별도 archive-data.js로 유지됩니다.

---

## v13.1 AUDIO MASTER

### 관리자 UI
- 사건 편집 상단에 `＋ 첨부파일` 버튼 추가
- 버튼을 누르면 첨부파일 관리 영역으로 바로 이동
- 저장되지 않은 새 사건에서는 먼저 `기록 저장` 안내
- 저장된 사건에서는 음성 제목 + 음성 파일 업로드 가능
- 등록된 첨부 음성 목록 확인/삭제 가능

### AUDIO VIEWER
- MP3 / OGG / WAV / AAC 계열 업로드
- 음성 파일은 Cloudflare R2 저장
- D1에는 첨부 메타데이터와 R2 key만 저장
- 사건 상세에서 `ATTACHED ARCHIVE`로 음성 기록 표시
- 클릭 시 려 AUDIO VIEWER 팝업
- 실제 재생 중인 음성을 Web Audio API가 분석해 Canvas 파형 자동 생성
- 사건마다 파형 수동 제작 불필요
- ▶ / Ⅱ 한 버튼 토글
- 재생 중 SIGNAL INTEGRITY 67~88% 자동 변화
- 복원율 bar 연동
- REC LED 점멸
- 일시정지 시 파형/신호/REC 모두 정지

### AUDIO VIEWER 배경
기본 파일:
`assets/ry-audio-viewer-bg.webp`

배경 이미지는 정적 프레임입니다.
파형/신호 수치/복원율/REC는 웹 레이어에서 동적으로 표시합니다.

---

## 최초 배포 / 업데이트 필수 설정

### 1. D1

기존 DB를 v13 이전부터 사용 중이면 Cloudflare D1 콘솔에서:

`migration_v13_audio.sql`

을 한 번 실행합니다.

새 DB를 만드는 경우에는 최신 `schema.sql`을 사용합니다.

### 2. R2

Cloudflare R2 버킷을 하나 생성합니다.

권장 예:
- Bucket name: `ryeo-media`
- Pages/Functions Binding name: `MEDIA`

중요:
코드가 사용하는 바인딩 이름은 반드시 `MEDIA`입니다.

기존 D1 바인딩:
`DB`

기존 관리자 환경변수:
`ADMIN_EMAIL`

은 유지합니다.

---

## 관리자 사용법

1. `/admin/` 접속
2. 기존 사건을 클릭하거나 `＋ 새 기록`
3. 새 사건이면 먼저 `기록 저장`
4. 편집 화면 상단의 `＋ 첨부파일` 클릭
5. `첨부파일 / 음성 기록 관리` 영역으로 이동
6. 음성 기록 제목 입력
7. MP3/OGG/WAV/AAC 파일 선택
8. `＋ 음성 기록 추가`
9. 업로드 완료 후 첨부 목록에서 확인

기존 사건을 선택한 상태라면 바로 첨부할 수 있습니다.

---

## 주요 파일

### Public
- `index.html`
- `styles.css`
- `script.js`
- `audio-viewer.css`
- `audio-viewer.js`
- `archive-data.js`

### Admin
- `admin/index.html`
- `admin/admin.css`
- `admin/admin.js`

### Database
- `schema.sql`
- `migration_v13_audio.sql`

### Cloudflare Functions
- `functions/api/records/`
- `functions/api/admin/records/`
- `functions/api/admin/attachments/`
- `functions/api/media.js`

### Assets
- `assets/ry-audio-viewer-bg.webp`
- `assets/logo-approved.png`
- `assets/ryeo-calligraphy-white.png`

---

## 업데이트 이력

### v13.4 INLINE ATTACH + TRIAD HANJA MASTER
- 관리자 삼직 입력을 `[체크박스] 탐 - [번호]` / `[체크박스] 연 - [번호]` / `[체크박스] 호 - [번호]` 형태로 정리
- 관리자에서는 탐·연·호 한글로 표시
- 공개 사건 목록과 사건 상세에서는 探·硏·護 한자로 자동 표시
- 삼직 복수 선택 및 기록관 동시 선택 유지
- 기록 본문 우측에 `＋ 첨부자료` 버튼 추가
- 본문 커서 위치에 첨부자료 토큰 자동 삽입
- 첨부자료 관리에서 음성 + 이미지 업로드 지원
- 음성은 기존 RY AUDIO VIEWER로 자동 재생
- 이미지는 RY IMAGE VIEWER 팝업으로 열람
- 본문에 삽입한 첨부자료는 해당 문장 사이 위치에 표시
- 본문에 삽입하지 않은 첨부자료는 기존 하단 ATTACHED ARCHIVE에 표시
- 기존 `record_attachments` 테이블을 그대로 사용하므로 추가 D1 migration 없음


### v13.2 AUDIO + TRIAD MASTER
- 관리자 `담당 삼직 / 기록관` 입력을 자유 텍스트에서 체크형 UI로 변경
- 탐 / 연 / 호 / 기록관 4개 항목 제공
- 탐 / 연 / 호는 체크 시 옆 번호 입력칸 활성화
- 탐 / 연 / 호 복수 선택 가능
- 기록관도 삼직과 함께 복수 선택 가능
- 저장 형식 예: `탐-01 / 연-03 / 호-12 / 기록관`
- 공개 사이트에서는 기존 한자 데이터 `探 / 硏 / 護`도 자동으로 `탐 / 연 / 호`로 표시
- 기존 D1 `assigned_to` 컬럼을 그대로 사용하므로 추가 DB migration 불필요

### v13.1 AUDIO MASTER
- 관리자 편집 화면 상단에 `＋ 첨부파일` 버튼 추가
- 첨부 영역을 찾기 어렵던 UI 문제 수정
- 버튼 클릭 시 첨부 관리 영역 자동 스크롤/강조
- README를 `README.md` 한 파일로 통합

### v13 AUDIO MASTER
- D1 `record_attachments` 구조 추가
- Cloudflare R2 음성 저장 구조 추가
- 관리자 음성 업로드/삭제 추가
- 공개 사건 상세의 첨부 아카이브 추가
- 자동 파형 AUDIO VIEWER 추가

### v12
- 현재 사건 기록 공개 구조 및 사이트 표시 관련 이전 업데이트 유지

---

## 운영 원칙

README는 앞으로 이 `README.md` 하나만 유지합니다.
새 버전이 나와도 별도 README 파일을 만들지 않고
현재 버전 설명과 업데이트 이력을 이 파일에 계속 누적합니다.


## 본문 중간 첨부자료 사용법

1. 사건을 먼저 저장합니다.
2. `첨부자료 관리`에서 음성 또는 이미지를 업로드합니다.
3. 기록 본문에서 자료를 넣고 싶은 문장 위치에 커서를 둡니다.
4. 본문 오른쪽의 `＋ 첨부자료`를 누릅니다.
5. 원하는 자료를 선택합니다.
6. 본문에는 `[[ATTACHMENT:번호]]` 표식이 삽입됩니다.
7. `기록 저장`을 누릅니다.
8. 공개 게시글에서는 표식 자체는 보이지 않고 그 위치에 실제 자료 열람 카드가 표시됩니다.

관리자에서는 표식을 남겨 위치를 명확히 확인할 수 있게 했습니다.
