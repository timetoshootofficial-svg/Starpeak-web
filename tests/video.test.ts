import { describe, expect, it } from 'vitest'
import { embedUrl, parseVideoUrl } from '@/lib/video'

describe('video links', () => {
  it('reads every common YouTube link', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?si=abc',
      'https://youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10',
    ]) {
      expect(parseVideoUrl(url)).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
    }
  })

  it('reads public and unlisted Vimeo links', () => {
    expect(parseVideoUrl('https://vimeo.com/1250249305')).toEqual({ provider: 'vimeo', id: '1250249305', hash: undefined })
    expect(parseVideoUrl('https://vimeo.com/1250249305/882c5fa3e6')).toEqual({ provider: 'vimeo', id: '1250249305', hash: '882c5fa3e6' })
    expect(parseVideoUrl('https://player.vimeo.com/video/1250249305?h=882c5fa3e6')).toEqual({
      provider: 'vimeo',
      id: '1250249305',
      hash: '882c5fa3e6',
    })
  })

  it('leaves Vimeo share links for the server to resolve, and rejects others', () => {
    expect(parseVideoUrl('https://vimeo.com/share/261068ba-f022-4b38-8cf8-19fad7dbb053')).toBeNull()
    expect(parseVideoUrl('https://example.com/video.mp4')).toBeNull()
    expect(parseVideoUrl('not a url')).toBeNull()
  })

  it('builds privacy-friendly player URLs', () => {
    expect(embedUrl({ provider: 'youtube', id: 'dQw4w9WgXcQ' })).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(embedUrl({ provider: 'vimeo', id: '1250249305', hash: '882c5fa3e6' })).toContain(
      'player.vimeo.com/video/1250249305?',
    )
    expect(embedUrl({ provider: 'vimeo', id: '1250249305', hash: '882c5fa3e6' })).toContain('h=882c5fa3e6')
  })
})
