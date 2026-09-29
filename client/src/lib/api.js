import JSZip from 'jszip';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function resolveMedia(url) {
  const response = await fetch(`${API}/api/media/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Unable to resolve this URL.');
  return data;
}

function extensionFor(item) {
  if (item.type === 'video') return 'mp4';
  const source = `${item.previewUrl || ''}`.toLowerCase();
  if (/\.png(?:$|[?#])/.test(source)) return 'png';
  if (/\.webp(?:$|[?#])/.test(source)) return 'webp';
  if (/\.gif(?:$|[?#])/.test(source)) return 'gif';
  return 'jpg';
}

function filenameFor(item, index) {
  return `media-${item.type}-${index}.${extensionFor(item)}`;
}

async function fetchDirectMedia(item) {
  const response = await fetch(item.previewUrl, { mode: 'cors' });
  if (!response.ok) throw new Error(`Media ${item.index || ''} could not be fetched directly.`.trim());
  const blob = await response.blob();
  if (!blob.size) throw new Error(`Media ${item.index || ''} is empty.`.trim());
  return blob;
}

export async function downloadOne(item, index) {
  try {
    const blob = await fetchDirectMedia(item);
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filenameFor(item, index);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return;
  } catch {
    // Cross-origin media hosts can block browser fetches even when the URL itself is public.
    // Fall back to the direct URL so the browser can open/download it without proxying through us.
    const anchor = document.createElement('a');
    anchor.href = item.downloadUrl || item.previewUrl;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}

export async function downloadAll(media) {
  if (!media?.length) return;

  const zip = new JSZip();
  for (let index = 0; index < media.length; index += 1) {
    const item = media[index];
    let blob;
    try {
      blob = await fetchDirectMedia(item);
    } catch {
      throw new Error(`Download all cannot create the ZIP because media #${index + 1} blocks browser access. Download that item individually instead.`);
    }
    zip.file(filenameFor(item, index + 1), blob);
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${media[0]?.platform || 'media'}-media.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
