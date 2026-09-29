import { describe, expect, it } from 'vitest';
import { parseSocialUrl } from '../src/utils/social-url.js';

describe('social URL validation', () => {
  it('accepts Instagram posts and reels', () => {
    expect(parseSocialUrl('https://www.instagram.com/p/ABC123/').platform).toBe('instagram');
    expect(parseSocialUrl('https://instagram.com/reel/ABC123/?igsh=abc').platform).toBe('instagram');
  });

  it('accepts Facebook and X/Twitter URLs', () => {
    expect(parseSocialUrl('https://www.facebook.com/watch/?v=123').platform).toBe('facebook');
    expect(parseSocialUrl('https://www.facebook.com/reel/123').platform).toBe('facebook');
    expect(parseSocialUrl('https://www.facebook.com/share/v/abc/').platform).toBe('facebook');
    expect(parseSocialUrl('https://x.com/example/status/123').platform).toBe('twitter');
    expect(parseSocialUrl('https://twitter.com/example/status/123').platform).toBe('twitter');
    expect(parseSocialUrl('https://mobile.x.com/example/status/123').platform).toBe('twitter');
  });

  it('accepts direct media URLs', () => {
    expect(parseSocialUrl('https://cdn.example.com/video.mp4').platform).toBe('direct');
  });

  it('rejects invalid protocols', () => {
    expect(parseSocialUrl('javascript:alert(1)').ok).toBe(false);
  });
});
