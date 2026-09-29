function decodeBase64Url(value) {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function rapidCdnMetadata(value) {
  try {
    const u = new URL(value);
    if (u.hostname.toLowerCase() !== 'd.rapidcdn.app') return null;
    const token = u.searchParams.get('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(decodeBase64Url(parts[1]) || '{}');
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

export function inferMediaType(value, hint = '') {
  const lower = String(value || '').toLowerCase();
  const hintLower = String(hint || '').toLowerCase();

  if (hintLower === 'video' || hintLower.startsWith('video/')) return 'video';
  if (/\.(mp4|mov|m4v|webm)(?:$|[?#])/i.test(lower)) return 'video';

  const rapid = rapidCdnMetadata(value);
  const nested = [rapid?.filename, rapid?.url, rapid?.contentType, rapid?.mimeType, rapid?.type]
    .filter(Boolean).join(' ').toLowerCase();
  if (/\.(mp4|mov|m4v|webm)(?:$|[?#\s])/i.test(nested) || /\bvideo\//i.test(nested) || /\bvideo\b/i.test(nested)) return 'video';

  return 'image';
}

export function extensionFor(type, contentType = '', mediaUrl = '') {
  const actualType = inferMediaType(mediaUrl, type || contentType);
  if (actualType === 'video' || contentType.startsWith('video/')) return 'mp4';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

export function filenameFor(type, index = 1, contentType = '', mediaUrl = '') {
  const actualType = inferMediaType(mediaUrl, type);
  return `media-${actualType}-${index}.${extensionFor(actualType, contentType, mediaUrl)}`;
}
