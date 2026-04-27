# TikFinity Gift Overlay

TikFinity Desktop App에서 수신한 이벤트를 Receiver 앱이 받아 Render 서버로 전송하고, OBS 브라우저 소스에서 기프트/멤버 레벨업 카드를 표시하는 오버레이입니다.

이번 버전은 서버 주소가 아래 주소로 고정되어 있습니다.

```txt
https://tikfinity-gift-overlay.onrender.com
```

클라이언트는 서버 주소를 입력하지 않습니다. 제작자가 발급한 `Client ID`만 Receiver 앱에 입력합니다.

---

## 1. 전체 구조

```txt
TikFinity Desktop App
↓ ws://localhost:21213/
TikFinity Gift Receiver.exe
↓ https://tikfinity-gift-overlay.onrender.com/api/events/:clientId
Render Server
↓
OBS Browser Source /overlay/:clientId
```

---

## 2. 클라이언트 ID 관리

등록된 Client ID만 사용할 수 있습니다.

관리 파일:

```txt
server/data/clients.json
```

기본 예시:

```json
{
  "client_test_01": {
    "name": "테스트 클라이언트",
    "status": "active",
    "memo": "처음 배포 테스트용 ID입니다. 실제 클라이언트 ID를 이 파일에 추가해서 사용하세요.",
    "createdAt": "2026-04-27"
  }
}
```

새 클라이언트를 추가할 때는 아래처럼 ID를 추가합니다.

```json
{
  "client_test_01": {
    "name": "테스트 클라이언트",
    "status": "active",
    "memo": "테스트용",
    "createdAt": "2026-04-27"
  },
  "client_ruri_01": {
    "name": "아즈사가와 루리",
    "status": "active",
    "memo": "정식 이용자",
    "createdAt": "2026-04-27"
  }
}
```

비활성화하려면 `status`를 `disabled`로 변경합니다.

```json
"status": "disabled"
```

등록되지 않은 Client ID는 이벤트 전송, 오버레이 접근, 설정 페이지 접근이 거부됩니다.

---

## 3. Render 서버 배포

GitHub에 전체 폴더를 업로드한 뒤 Render에서 Web Service를 생성합니다.

Render 설정:

```txt
Root Directory: server
Build Command: npm install
Start Command: npm start
```

`render.yaml`을 사용하는 경우 자동으로 아래 설정이 적용됩니다.

```txt
rootDir: server
buildCommand: npm install
startCommand: npm start
```

배포 후 아래 주소가 정상적으로 열리면 서버가 실행 중입니다.

```txt
https://tikfinity-gift-overlay.onrender.com/health
```

---

## 4. Receiver.exe 빌드

제작자 PC에서만 진행합니다. 클라이언트는 이 과정을 하지 않습니다.

```bash
cd receiver-app
npm install
npm run build:win
```

또는:

```bash
npm run dist
```

빌드 결과:

```txt
receiver-app/dist/TikFinity-Gift-Receiver.exe
```

이 파일을 클라이언트에게 전달하면 됩니다.

Windows에서 심볼릭 링크 권한 오류가 나면 PowerShell을 관리자 권한으로 실행하거나 Windows 개발자 모드를 켠 뒤 다시 빌드합니다.

---

## 5. 클라이언트에게 전달할 정보

클라이언트에게는 아래 두 가지만 전달하면 됩니다.

```txt
1. TikFinity-Gift-Receiver.exe
2. Client ID
```

예시:

```txt
Client ID: client_ruri_01
```

Receiver 앱 안에서 오버레이 URL과 설정 페이지 URL을 복사할 수 있습니다.

예시 URL:

```txt
OBS 오버레이:
https://tikfinity-gift-overlay.onrender.com/overlay/client_ruri_01

설정 페이지:
https://tikfinity-gift-overlay.onrender.com/settings/client_ruri_01
```

---

## 6. 클라이언트 사용 순서

```txt
1. TikFinity Desktop App 실행
2. TikTok LIVE 연결
3. TikFinity Gift Receiver.exe 실행
4. 제공받은 Client ID 입력
5. 리시버 시작 클릭
6. 오버레이 URL 복사
7. OBS 브라우저 소스에 붙여넣기
```

서버 주소는 Receiver 앱에 고정되어 있으므로 클라이언트가 입력하지 않습니다.

---

## 7. 설정 저장

설정은 Client ID별로 분리됩니다.

```txt
client_ruri_01 설정 ≠ client_test_01 설정
```

설정 페이지에서 변경 가능한 항목:

```txt
- 기프트 이름 표시
- 기프트 이미지 표시
- 후원자 프로필 사진 표시
- 다이아 표시
- 정렬 방식: 최신순 / 금액순
- 최소 표시 금액
- 후원 카드 색상
- 레벨업 카드 색상
- 배경 / 텍스트 / 보더 / 그라데이션
```

주의: Render 무료 환경에서는 재배포/재시작 시 서버 내부 파일 저장값이 초기화될 수 있습니다. 정식 운영에서 설정을 장기간 보존하려면 Render Disk 또는 Supabase 같은 외부 DB 사용을 권장합니다.

---

## 8. 이벤트 처리 방식

### Gift

```txt
- gift 이벤트만 카드 생성
- repeatCount 기준으로 수량 계산
- 설정한 최소 다이아 미만은 표시하지 않음
- 최신순/금액순 정렬 선택 가능
```

### Member Level

```txt
- chat / like / join 등에서 memberLevel 값을 읽음
- 사용자별 마지막 레벨과 비교
- 최초 값은 저장만 함
- 이전 레벨보다 상승했을 때만 레벨업 카드 표시
```

채팅/좋아요 자체는 화면에 표시하지 않습니다.

---

## 9. 테스트

등록된 Client ID 기준으로 아래 주소를 열어 확인할 수 있습니다.

```txt
https://tikfinity-gift-overlay.onrender.com/api/client/client_test_01
https://tikfinity-gift-overlay.onrender.com/overlay/client_test_01
https://tikfinity-gift-overlay.onrender.com/settings/client_test_01
```

등록되지 않은 ID는 404 또는 접근 거부가 나오는 것이 정상입니다.
