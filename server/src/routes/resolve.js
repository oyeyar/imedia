import express from 'express';
import { isDirectMediaUrl, resolveSocial } from '../services/media-resolver.js';
import { parseSocialUrl } from '../utils/social-url.js';
import { inferMediaType } from '../utils/media.js';

const router = express.Router();

function normalizeMedia(media, platform) {
  const seen = new Set();
  return media.filter((item) => {
    if (!item?.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).map((item, index) => ({
    id: Buffer.from(item.url).toString('base64url'),
    type: inferMediaType(item.url, item.type),
    thumbnail: item.thumbnail || null,
    previewUrl: item.url,
    downloadUrl: item.url,
    index: index + 1,
    platform
  }));
}

router.post('/resolve', async (req, res) => {
  const parsed = parseSocialUrl(req.body?.url);
  if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

  try {
    if (parsed.platform === 'direct') {
      if (!isDirectMediaUrl(parsed.url)) {
        return res.status(400).json({
          success: false,
          message: 'That URL is not a supported social-media link or an obvious direct media URL. Paste a direct image/video URL such as a .mp4 or .jpg link.'
        });
      }

      const type = inferMediaType(parsed.url);
      return res.json({
        success: true,
        sourceUrl: parsed.url,
        platform: 'direct',
        kind: 'direct',
        count: 1,
        media: [{
          id: Buffer.from(parsed.url).toString('base64url'),
          type,
          thumbnail: null,
          previewUrl: parsed.url,
          downloadUrl: parsed.url,
          index: 1,
          platform: 'direct'
        }]
      });
    }

    const media = await resolveSocial(parsed.platform, parsed.url, Number(process.env.RESOLVER_TIMEOUT_MS || 30000));
    const normalized = normalizeMedia(media, parsed.platform);
    if (!normalized.length) throw new Error('No public media was found.');

    return res.json({
      success: true,
      sourceUrl: parsed.url,
      platform: parsed.platform,
      kind: parsed.kind,
      count: normalized.length,
      media: normalized
    });
  } catch (error) {
    console.error('[resolve]', parsed.platform, error?.message || error);
    return res.status(502).json({
      success: false,
      message: `${parsed.platform === 'instagram' ? 'Instagram' : parsed.platform === 'facebook' ? 'Facebook' : 'X / Twitter'} could not be resolved. The content may be private, unavailable, rate-limited, or temporarily unsupported.`
    });
  }
});

export default router;
