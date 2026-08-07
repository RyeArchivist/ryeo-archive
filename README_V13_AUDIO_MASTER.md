# 慮 記錄網 v13 AUDIO MASTER

기존 `ryeo_site_dynamic_board_v12_reveal_mark_only` 전체 기능에 음성 첨부/자동 파형 플레이어를 병합한 버전입니다.

## 이번 버전에서 추가된 기능

- 관리자 사건 편집 화면에 `첨부 기록 관리` 영역 추가
- 저장된 사건에 MP3 / OGG / WAV / AAC 계열 음성 업로드 가능
- 음성 파일은 Cloudflare R2에 저장
- D1에는 첨부 메타데이터와 R2 key만 저장
- 사건 상세 팝업에 `ATTACHED ARCHIVE` 자동 표시
- 음성 기록 클릭 시 려 AUDIO VIEWER 팝업 표시
- 실제 재생 중인 음성을 Web Audio API로 분석하여 파형 자동 생성
- 사건별 파형 수동 제작 불필요
- ▶ / Ⅱ 한 버튼 토글
- 재생 중 SIGNAL INTEGRITY 67~88% 자동 변화
- 복원율 bar 자동 연동
- REC LED 자동 점멸
- 일시정지 시 파형/신호/REC 모두 정지
- PC / 모바일에서 동일한 상대 좌표(%)로 플레이어 유지
- 사건 삭제 시 연결된 R2 음성도 함께 정리 시도

## 최초 배포 시 꼭 해야 하는 2가지

### 1. 기존 D1에 migration 실행

Cloudflare D1 콘솔에서 아래 파일 전체를 한 번 실행:

`migration_v13_audio.sql`

새 DB를 처음 만드는 경우에는 업데이트된 `schema.sql`만 사용하면 됩니다.

### 2. R2 바인딩 추가

Cloudflare에서 R2 버킷을 하나 생성한 뒤 Pages 프로젝트에 바인딩합니다.

반드시 바인딩 이름:

`MEDIA`

예:
- R2 bucket: `ryeo-media`
- Variable / Binding name: `MEDIA`

D1 기존 바인딩 `DB`와 관리자 환경변수 `ADMIN_EMAIL`은 현재 사이트 설정 그대로 유지합니다.

## 파일 저장 구조

R2:
`records/{record_id}/audio/{uuid}-{filename}`

D1:
`record_attachments`

파일 자체를 D1에 넣지 않습니다.

## 관리자 사용법

1. `/admin/` 접속
2. 사건을 선택하거나 새 사건 작성
3. 새 사건은 먼저 `기록 저장`
4. 아래 `첨부 기록 관리`에서 제목 입력
5. 음성 파일 선택
6. `＋ 음성 기록 추가`
7. 업로드 완료

공개 상태의 사건이라면 사건 상세창 하단에 음성 기록이 자동 표시됩니다.

## AUDIO VIEWER 배경

`assets/ry-audio-viewer-bg.webp`

현재 제공된 려 음성 콘솔 이미지를 정적 배경으로 포함했습니다.
기존 이미지의 파형/67% 영역은 웹 레이어가 어두운 마스크로 덮은 뒤,
실제 Canvas 파형과 동적 SIGNAL 값이 위에 표시됩니다.

따라서 사건마다 영상이나 파형을 새로 제작할 필요가 없습니다.

## 주요 추가 파일

- `audio-viewer.css`
- `audio-viewer.js`
- `assets/ry-audio-viewer-bg.webp`
- `migration_v13_audio.sql`
- `functions/api/media.js`
- `functions/api/admin/attachments/index.js`
- `functions/api/admin/attachments/[id].js`

기존 파일 중 병합 수정:
- `index.html`
- `script.js`
- `schema.sql`
- `admin/index.html`
- `admin/admin.css`
- `admin/admin.js`
- `functions/api/records/[id].js`
- `functions/api/admin/records/[id].js`

## 주의

Cloudflare의 D1/R2 바인딩 자체는 ZIP 파일만 업로드한다고 자동 생성되지 않습니다.
`migration_v13_audio.sql` 실행과 `MEDIA` R2 바인딩 연결은 최초 한 번 Cloudflare 대시보드에서 해야 합니다.

그 이후에는 관리자가 사건별로 음성만 업로드하면 사이트가 자동 처리합니다.
