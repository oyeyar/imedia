import { Download, ExternalLink, Film, Image as ImageIcon, LoaderCircle } from 'lucide-react';
import { downloadOne } from '../lib/api.js';

export default function MediaCard({ item, index, busy, onBusy }) {
  const isVideo = item.type === 'video';

  async function handleDownload() {
    if (busy) return;
    onBusy(index);
    try {
      await downloadOne(item, index + 1);
    } finally {
      onBusy(null);
    }
  }

  return <article className="media-card">
    <div className="media-preview">
      {isVideo ? (
        <video controls preload="metadata" poster={item.thumbnail || undefined} src={item.previewUrl} />
      ) : (
        <img src={item.previewUrl} alt={`Media ${index + 1}`} loading="lazy" />
      )}
    </div>
    <div className="media-meta">
      <span className="media-type">{isVideo ? <Film size={14}/> : <ImageIcon size={14}/>} {isVideo ? 'Video' : 'Image'}</span>
      <span>#{index + 1}</span>
    </div>
    <div className="media-actions">
      <button className="primary-action" onClick={handleDownload} disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={18}/> : <Download size={18}/>} {busy ? 'Preparing' : 'Download'}
      </button>
      <a className="secondary-action" href={item.previewUrl} target="_blank" rel="noreferrer"><ExternalLink size={17}/> Open</a>
    </div>
  </article>;
}
