import { igdl, fbdown, twitter } from 'btch-downloader';
import { inferMediaType } from '../utils/media.js';

function isUrl(value) {
  try { return Boolean(new URL(value)); } catch { return false; }
}

function looksLikeMediaUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const source = `${url.pathname}${url.search}`.toLowerCase();
    return /\.(mp4|mov|m4v|webm|jpg|jpeg|png|gif|webp)(?:$|[?#])/.test(source)
      || host === 'd.rapidcdn.app'
      || host.includes('cdninstagram.com')
      || host.includes('fbcdn.net')
      || host === 'video.twimg.com'
      || host === 'pbs.twimg.com';
  } catch {
    return false;
  }
}

function collectCandidates(value, out = [], depth = 0) {
  if (depth > 10 || value == null) return out;
  if (typeof value === 'string') {
    if (isUrl(value) && looksLikeMediaUrl(value)) out.push({ url: value });
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectCandidates(item, out, depth + 1);
    return out;
  }
  if (typeof value !== 'object') return out;

  const preferred = ['url', 'download', 'downloadUrl', 'video', 'videoUrl', 'image', 'imageUrl', 'src', 'mediaUrl', 'hd', 'sd'];
  for (const key of preferred) {
    if (typeof value[key] === 'string' && isUrl(value[key])) {
      out.push({
        url: value[key],
        thumbnail: value.thumbnail || value.thumb || value.cover || value.poster || null,
        type: key.toLowerCase().includes('video') || /\.(mp4|mov|m4v|webm)(?:$|[?#])/i.test(value[key]) ? 'video' : 'image'
      });
    }
  }

  for (const [key, child] of Object.entries(value)) {
    if (preferred.includes(key)) continue;
    if (typeof child === 'object') collectCandidates(child, out, depth + 1);
  }
  return out;
}

function uniqueMedia(result) {
  const candidates = collectCandidates(result);
  return [...new Map(candidates.map((item) => [item.url, item])).values()].map((item) => ({
    type: inferMediaType(item.url, item.type),
    url: item.url,
    thumbnail: item.thumbnail || null
  }));
}

export function isDirectMediaUrl(input) {
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    return /\.(mp4|mov|m4v|webm|jpg|jpeg|png|gif|webp)(?:$|[?#])/i.test(url.pathname + url.search);
  } catch {
    return false;
  }
}

export async function resolveSocial(platform, url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resolver = platform === 'instagram' ? igdl : platform === 'facebook' ? fbdown : twitter;
    const result = await Promise.race([
      resolver(url),
      new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('Resolver timed out.')), { once: true }))
    ]);

    const media = uniqueMedia(result);
    if (!media.length) throw new Error('No public media was found.');
    return media;
  } finally {
    clearTimeout(timer);
  }
}
