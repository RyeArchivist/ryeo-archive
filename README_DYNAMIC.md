# 실제 게시판 설정 순서

이 프로젝트는 Cloudflare Pages Functions + D1을 사용합니다.

## 반드시 설정할 것

1. Cloudflare에서 D1 데이터베이스 생성
2. D1 콘솔에서 `schema.sql` 실행
3. 샘플 글이 필요하면 `seed.sql` 실행
4. Pages 프로젝트 Settings > Bindings에서 D1 binding 추가
   - Variable name: `DB`
   - 생성한 D1 데이터베이스 선택
5. Pages 프로젝트 Settings > Variables에서 환경변수 추가
   - `ADMIN_EMAIL` = 관리자 이메일 주소
6. Cloudflare Zero Trust Access에서 두 경로 보호
   - `ryeo-archive.pages.dev/admin/*`
   - `ryeo-archive.pages.dev/api/admin/*`
   - Allow 정책에는 관리자 이메일 하나만 등록
   - 로그인 방식은 One-time PIN(OTP)
7. GitHub에 이 폴더 전체 업로드 후 재배포

## 관리자 주소
`https://ryeo-archive.pages.dev/admin/`

## 일반 이용자
공개 처리한 글만 慮 내부망 사건 기록에 나타납니다.


## v2 고정 선택 항목
- 괴이 유형은 관리자 화면에서 한글 체크박스로 복수 선택
- 저장 및 공개 화면에서는 `現象 / 個體 / 物件 / 傳染 / 記錄 / 未分類` 한자로 표시
- `未分類`는 다른 유형과 동시에 선택되지 않음
- 위험 분류는 `평가 불가 / 접근 제한 / 기록 오염 / 인명 위험` 드롭다운
- 진행 상태는 `관찰 중 / 분석 중 / 회수 대기 / 회수 완료 / 열람 금지 / 회수 기록 없음` 드롭다운
- 공개 사건 목록에서 위험·상태에 따라 색상이 자동 지정됨
