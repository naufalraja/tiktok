const urlInput = document.getElementById('urlInput');
const pasteBtn = document.getElementById('pasteBtn');
const downloadBtn = document.getElementById('downloadBtn');
const status = document.getElementById('status');
const qualityWrap = document.getElementById('qualityWrap');
const qualitySelect = document.getElementById('qualitySelect');
let selectedFormat = 'video';

function setStatus(message, type = '') { status.textContent = message; status.className = 'status ' + type; }

document.querySelectorAll('.format').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.format').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); selectedFormat = btn.dataset.format;
  qualityWrap.hidden = selectedFormat === 'audio';
  downloadBtn.querySelector('span:first-child').textContent = selectedFormat === 'audio' ? 'Download MP3' : 'Download video';
  setStatus('');
}));

pasteBtn.addEventListener('click', async () => {
  try { urlInput.value = await navigator.clipboard.readText(); setStatus('Link berhasil ditempel.'); }
  catch { setStatus('Clipboard tidak dapat diakses. Tempel link secara manual (Cmd/Ctrl + V).', 'error'); }
});

downloadBtn.addEventListener('click', async () => {
  const link = urlInput.value.trim();
  try {
    const parsed = new URL(link);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (!['tiktok.com','vm.tiktok.com','vt.tiktok.com'].some(d => host === d || host.endsWith('.' + d))) throw new Error('Masukkan link TikTok yang valid terlebih dahulu.');
  } catch (e) { setStatus(e.message || 'Link tidak valid.', 'error'); return; }
  downloadBtn.disabled = true;
  setStatus('Memproses link… mohon tunggu.');
  try {
    const response = await fetch('/api/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link, format: selectedFormat, quality: qualitySelect.value }) });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Download gagal.'); }
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1] : (selectedFormat === 'audio' ? 'tiktok-audio.mp3' : 'tiktok-video.mp4');
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = objectUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(objectUrl);
    setStatus('Download berhasil dimulai.');
  } catch (e) { setStatus(e.message || 'Terjadi kesalahan saat memproses download.', 'error'); }
  finally { downloadBtn.disabled = false; }
});
