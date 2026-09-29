import { describe, expect, it } from 'vitest';
import { inferMediaType, filenameFor } from '../src/utils/media.js';
import { isDirectMediaUrl } from '../src/services/media-resolver.js';

describe('media utilities', () => {
  it('detects obvious direct media URLs', () => {
    expect(isDirectMediaUrl('https://cdn.example.com/video.mp4?token=abc')).toBe(true);
    expect(isDirectMediaUrl('https://cdn.example.com/photo.jpg')).toBe(true);
    expect(isDirectMediaUrl('https://example.com/article')).toBe(false);
  });

  it('does not let an image hint override an MP4 RapidCDN token', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ filename: 'example.mp4', url: 'https://scontent.cdninstagram.com/example.mp4' })).toString('base64url');
    const url = `https://d.rapidcdn.app/v2?token=${header}.${payload}.signature`;
    expect(inferMediaType(url, 'image')).toBe('video');
    expect(filenameFor('image', 2, '', url)).toBe('media-video-2.mp4');
  });
});
