# TikFinity Gift Overlay

TikFinity Desktop App의 `ws://localhost:21213/` WebSocket 이벤트를 클라이언트 PC의 Receiver 앱이 받아서 Render 서버로 전송하고, OBS는 Render의 오버레이 URL을 브라우저 소스로 사용하는 구조입니다.

## 최종 사용 흐름(클라이언트)

클라이언트는 터미널/Node/npm을 사용하지 않습니다.

1. TikFinity Desktop App 실행
2. TikFinity에서 라이브 연결
3. 배포받은 `TikFinity-Gift-Receiver.exe` 실행
4. 앱에 Render 서버 URL과 Client ID 입력
5. `리시버 시작` 클릭
6. OBS 브라우저 소스에 `https://서버주소/overlay/CLIENT_ID` 추가

## URL 구조

- Overlay: `/overlay/:clientId`
- 설정 페이지: `/control/:clientId`
- 상태 API: `/api/state/:clientId`
- 설정 API: `/api/settings/:clientId`
- 이벤트 수신 API: `/api/events/:clientId`

Client ID가 다르면 이벤트/설정/멤버 레벨 저장값이 서로 분리됩니다.

## 구현된 기능

- 기프트 이름 표시 on/off
- 기프트 이미지 표시 on/off
- 후원자 프로필 사진 표시 on/off
- 다이아 환산값 표시 on/off
- 후원 카드 색상 설정
- 레벨업 카드 색상 설정
- 텍스트/배경/보더/그라데이션 설정
- 최신순/금액순 정렬
- 최소 표시 금액
- 클라이언트별 설정 분리
- 멤버 레벨 변화 감지
- chat/like/join 등 일반 이벤트에 포함된 memberLevel도 비교용으로 처리
- 최초 관측 레벨은 기준값으로만 저장하고 표시하지 않음
- 이전 저장 레벨보다 상승했을 때만 레벨업 카드 표시
- TikFinity 연결 끊김 자동 재연결
- Render 연결 상태 확인
- Receiver 앱 내 이벤트 로그

## Render 배포

Render에서 이 저장소를 연결한 뒤 `render.yaml`을 사용하거나 아래처럼 설정하세요.

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node 20+

## Receiver 앱 개발자 빌드

이 과정은 제작자 PC에서만 필요합니다. 클라이언트에게 요구하지 않습니다.

```bash
cd receiver-app
npm install
npm run build:win
```

빌드 결과물은 `receiver-app/dist/TikFinity-Gift-Receiver.exe`입니다.

## 서버 로컬 테스트

```bash
cd server
npm install
npm start
```

브라우저에서 아래 주소를 확인합니다.

- `http://localhost:3000/health`
- `http://localhost:3000/overlay/test-client`
- `http://localhost:3000/control/test-client`

## 중요 메모

TikFinity 예제와 동일하게 Receiver는 `ws://localhost:21213/`에 연결합니다. 따라서 클라이언트 PC에서 TikFinity Desktop App이 실행되어 있고 라이브 연결 상태여야 이벤트가 들어옵니다.

## Receiver 앱 편의 기능

이번 버전의 Receiver 앱에는 클라이언트 배포용 편의 기능이 포함되어 있습니다.

- Client ID / Render 서버 URL / TikFinity WebSocket URL 자동 저장
- 앱 재실행 후에도 마지막 설정 유지
- TikFinity 연결 성공 시 초록색 상태 표시
- TikFinity 연결 실패/끊김 시 빨간색 상태 표시
- Render 서버 연결 성공 시 초록색 상태 표시
- Render 서버 연결 실패 시 빨간색 상태 표시
- OBS 오버레이 URL 표시 및 복사 버튼
- 설정 페이지 URL 표시 및 복사 버튼

클라이언트에게는 Receiver 앱에서 표시되는 `OBS 오버레이 URL`을 복사해서 OBS 브라우저 소스에 넣으라고 안내하면 됩니다.
