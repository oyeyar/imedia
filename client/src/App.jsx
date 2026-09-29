import { useState } from 'react';
import { Download, Facebook, Film, Image as ImageIcon, Instagram, Layers, Link2, LoaderCircle, ShieldCheck, Twitter, X } from 'lucide-react';
import { downloadAll, resolveMedia } from './lib/api.js';
import MediaCard from './components/MediaCard.jsx';

const platformInfo = {
  instagram: { label: 'Instagram', icon: Instagram },
  facebook: { label: 'Facebook', icon: Facebook },
  twitter: { label: 'X / Twitter', icon: Twitter },
  direct: { label: 'Direct media URL', icon: Film }
};

function PlatformIcon({ platform, size = 18 }) {
  const Icon = platformInfo[platform]?.icon || Link2;
  return <Icon size={size}/>;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [busyIndex, setBusyIndex] = useState(null);

  async function submit(event) {
    event?.preventDefault();
    setError('');
    setResult(null);
    if (!url.trim()) return setError('Paste an Instagram, Facebook, X/Twitter, or direct media URL.');
    setLoading(true);
    try {
      setResult(await resolveMedia(url.trim()));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadAll() {
    if (!result?.media?.length || result.media.length < 2) return;
    setDownloadingAll(true);
    setError('');
    try {
      await downloadAll(result.media);
    } catch (e) {
      setError(e.message || 'Unable to create the ZIP in your browser.');
    } finally {
      setDownloadingAll(false);
    }
  }

  const platform = result?.platform || null;
  const platformLabel = platformInfo[platform]?.label || 'Media';

  return <div className="app-shell">
    <header className="nav">
      <div className="brand"><span className="brand-icon" aria-hidden="true"><Layers size={20}/></span><span>iMediaYar</span></div>
      <span className="badge"><ShieldCheck size={15}/> Direct downloads • Public content</span>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><Layers size={14}/> MEDIA DOWNLOADER</div>
        <h1>Your media. One link away.</h1>
        <p>Paste a public Instagram, Facebook, X/Twitter link, or a direct image/video URL. We find the media, then your device downloads it directly.</p>

        <form className="search-box" onSubmit={submit}>
          <Link2 size={21} className="muted"/>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a social or direct media URL..." aria-label="Media URL" />
          {url && <button type="button" className="icon-button" onClick={() => {setUrl('');setResult(null);setError('')}}><X size={18}/></button>}
          <button className="download-button" disabled={loading}>
            {loading ? <><LoaderCircle className="spin" size={18}/> Resolving</> : <><Download size={18}/> Fetch media</>}
          </button>
        </form>

        <div className="platforms">
          <span><Instagram size={15}/> Instagram</span>
          <span><Facebook size={15}/> Facebook</span>
          <span><Twitter size={15}/> X / Twitter</span>
          <span><Link2 size={15}/> Direct URL</span>
        </div>
        {error && <div className="error">{error}</div>}
      </section>

      {result && <section className="results">
        <div className="result-head">
          <div>
            <div className="eyebrow"><PlatformIcon platform={platform} size={13}/> {platformLabel.toUpperCase()}</div>
            <h2>{result.count} media item{result.count === 1 ? '' : 's'} found</h2>
          </div>
          <div className="result-actions">
            <button className="clear-results" onClick={() => setResult(null)}>Clear</button>
            {result.count > 1 && <button className="download-all" onClick={handleDownloadAll} disabled={downloadingAll}>
              {downloadingAll ? <><LoaderCircle className="spin" size={17}/> Creating ZIP</> : <><Download size={17}/> Download all</>}
            </button>}
          </div>
        </div>
        <div className="direct-note"><ShieldCheck size={15}/> Media files are downloaded directly by your device. They do not pass through this server.</div>
        <div className="grid">{result.media.map((item, i) => <MediaCard key={item.id} item={item} index={i} busy={busyIndex === i} onBusy={setBusyIndex}/>)}</div>
      </section>}

      {!result && <section className="how">
        <div><span>01</span><h3>Paste a link</h3><p>Use a public Instagram, Facebook, or X/Twitter post, or paste a direct image/video URL.</p></div>
        <div><span>02</span><h3>We resolve it</h3><p>The backend only finds the public media URL. It does not proxy the media file.</p></div>
        <div><span>03</span><h3>Download directly</h3><p>Your browser fetches the media from its source. Carousel ZIPs are built locally on your device.</p></div>
      </section>}
    </main>

    <footer>iMediaYar is an independent tool and is not affiliated with Instagram, Facebook, or X. Download only content you have permission to use.</footer>
  </div>;
}
