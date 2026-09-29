export function parseSocialUrl(input) {
  if (typeof input !== 'string' || !input.trim()) {
    return { ok: false, error: 'A URL is required.' };
  }

  let url;
  try { url = new URL(input.trim()); } catch {
    return { ok: false, error: 'Please enter a valid URL.' };
  }

  if (!['https:', 'http:'].includes(url.protocol)) {
    return { ok: false, error: 'Only HTTP and HTTPS URLs are supported.' };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const path = url.pathname.replace(/\/+$/, '');

  if (host === 'instagram.com') {
    if (/^\/(p|reel|reels|tv)\/[^/]+$/i.test(path)) {
      return { ok: true, platform: 'instagram', url: url.toString(), kind: path.split('/')[1].toLowerCase() };
    }
    return { ok: false, error: 'Use a public Instagram post or Reel URL.' };
  }

  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch') {
    return { ok: true, platform: 'facebook', url: url.toString(), kind: 'facebook' };
  }

  if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) {
    return { ok: true, platform: 'twitter', url: url.toString(), kind: 'twitter' };
  }

  return { ok: true, platform: 'direct', url: url.toString(), kind: 'direct' };
}
