# TikFinity Overlay 개선 수정본

## 적용된 기능

- 기프트/레벨업 오버레이 URL 분리
  - `/overlay/:clientId/gift`
  - `/overlay/:clientId/level`
  - `/overlay/:clientId/all`
- 관리자 패널 단일 유지 + 탭 구조 적용
  - 기프트 / 레벨업 / 컬러·프리셋 / 고정 관리 / URL·테스트
- 기프트 금액별 컬러 구간 적용
  - 0~99 / 100~499 / 500~999 / 1,000~4,999 / 5,000+
- 레벨업 레벨별 컬러 구간 적용
  - Lv.0~9 / Lv.10~19 / Lv.20~29 / Lv.30+
- 컬러 프리셋 추가
- 슈퍼 팬 ID/닉네임 입력 및 전용 컬러 추가
- 기프트/레벨업 박스 높이 설정 추가
- 긴 닉네임 전광판식 흐름 처리
- 이벤트별 카드 고정 기능 추가
  - 관리자 패널의 고정 관리 탭에서 체크
  - 여러 개 동시 고정 가능
  - 고정 카드는 상단 유지
- 클라이언트별 오버레이 권한 구조 추가
  - `server/data/clients.json`의 `entitlements`에서 관리
- Receiver 앱 멀티 오버레이 목록 구조로 변경
  - 사용 가능한 오버레이 목록 표시
  - 오버레이별 열기/복사 버튼 제공

## 클라이언트 권한 예시

```json
{
  "az_luly": {
    "name": "아즈사가와 루리",
    "status": "active",
    "entitlements": {
      "gift": true,
      "level": true,
      "all": true
    }
  }
}
```

특정 클라이언트에게 레벨업 보드를 미제공하려면:

```json
"entitlements": {
  "gift": true,
  "level": false,
  "all": false
}
```

## 실행

서버:

```bash
cd server
npm install
npm start
```

리시버:

```bash
cd receiver-app
npm install
npm start
```
