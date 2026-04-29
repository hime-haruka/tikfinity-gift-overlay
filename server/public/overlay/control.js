
function renderRemote() {
  const root = document.getElementById('remoteRoot');
  if (!root) return;

  const tab = getCurrentTab();

  if (['color', 'preset', 'url'].includes(tab)) {
    root.style.display = 'none';
    return;
  }

  root.style.display = 'block';

  if (tab === 'team') {
    root.innerHTML = renderTeamRemote();
  } else {
    root.innerHTML = renderCommonRemote();
  }
}
