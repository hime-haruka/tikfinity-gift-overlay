// Audio reactive overlay is intentionally disabled.
// Keeping this file prevents broken script references, but it makes no server requests.
(() => {
  const guide = document.getElementById("permissionGuide");
  const startBtn = document.getElementById("startAudioBtn");
  if (guide) {
    guide.style.display = "grid";
    guide.innerHTML = `
      <div>
        <b>오디오 스펙트럼 비활성화됨</b><br>
        요청량 절감을 위해 이 버전에서는 오디오 인터랙션을 사용하지 않습니다.
      </div>
    `;
  }
  if (startBtn) startBtn.style.display = "none";
})();
