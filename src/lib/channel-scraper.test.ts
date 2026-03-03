import { describe, it, expect } from 'vitest';
import { isAINewsTitle, isWithinDateCutoff, extractVideosFromData } from './channel-scraper';
import type { ChannelVideo } from './channel-scraper';

describe('isAINewsTitle', () => {
  it('AI뉴스 포함 제목을 인식한다', () => {
    expect(isAINewsTitle('이번주 AI뉴스 총정리')).toBe(true);
  });

  it('AI 뉴스 (띄어쓰기) 포함 제목을 인식한다', () => {
    expect(isAINewsTitle('AI 뉴스 모음')).toBe(true);
  });

  it('관련없는 제목은 false', () => {
    expect(isAINewsTitle('파이썬 기초 강의')).toBe(false);
  });

  it('빈 문자열은 false', () => {
    expect(isAINewsTitle('')).toBe(false);
  });
});

describe('isWithinDateCutoff', () => {
  it('"3개월 전"은 6개월 이내', () => {
    expect(isWithinDateCutoff('3개월 전', 6)).toBe(true);
  });

  it('"1년 전"은 6개월 초과', () => {
    expect(isWithinDateCutoff('1년 전', 6)).toBe(false);
  });

  it('"2주 전"은 6개월 이내', () => {
    expect(isWithinDateCutoff('2주 전', 6)).toBe(true);
  });

  it('"3일 전"은 6개월 이내', () => {
    expect(isWithinDateCutoff('3일 전', 6)).toBe(true);
  });

  it('"7개월 전"은 6개월 초과', () => {
    expect(isWithinDateCutoff('7개월 전', 6)).toBe(false);
  });

  it('"6개월 전"은 6개월 이내 (경계값)', () => {
    expect(isWithinDateCutoff('6개월 전', 6)).toBe(true);
  });

  it('"Streamed 2 months ago" 영어 형식도 파싱', () => {
    expect(isWithinDateCutoff('Streamed 2 months ago', 6)).toBe(true);
  });

  it('"1 year ago" 영어 1년은 6개월 초과', () => {
    expect(isWithinDateCutoff('1 year ago', 6)).toBe(false);
  });

  it('파싱 불가시 true 반환 (보수적)', () => {
    expect(isWithinDateCutoff('알 수 없는 날짜', 6)).toBe(true);
  });

  it('빈 문자열은 true (보수적)', () => {
    expect(isWithinDateCutoff('', 6)).toBe(true);
  });
});

describe('extractVideosFromData', () => {
  it('videoRenderer에서 영상 추출', () => {
    const data = {
      contents: {
        twoColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                richGridRenderer: {
                  contents: [{
                    richItemRenderer: {
                      content: {
                        videoRenderer: {
                          videoId: 'abc123def45',
                          title: { runs: [{ text: 'AI뉴스 최신 정리' }] },
                          publishedTimeText: { simpleText: '2개월 전' },
                        },
                      },
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    };

    const videos: ChannelVideo[] = [];
    const seen = new Set<string>();
    extractVideosFromData(data, videos, seen);

    expect(videos).toHaveLength(1);
    expect(videos[0].videoId).toBe('abc123def45');
    expect(videos[0].title).toBe('AI뉴스 최신 정리');
    expect(videos[0].publishedAt).toBe('2개월 전');
  });

  it('AI뉴스가 아닌 영상은 제외', () => {
    const data = {
      videoRenderer: {
        videoId: 'xyz789abc12',
        title: { simpleText: '파이썬 강의 10편' },
        publishedTimeText: { simpleText: '1개월 전' },
      },
    };

    const videos: ChannelVideo[] = [];
    const seen = new Set<string>();
    extractVideosFromData(data, videos, seen);

    expect(videos).toHaveLength(0);
  });

  it('중복 videoId는 무시', () => {
    const data = {
      items: [
        {
          videoRenderer: {
            videoId: 'abc123def45',
            title: { simpleText: 'AI뉴스 1편' },
            publishedTimeText: { simpleText: '1개월 전' },
          },
        },
        {
          videoRenderer: {
            videoId: 'abc123def45',
            title: { simpleText: 'AI뉴스 1편' },
            publishedTimeText: { simpleText: '1개월 전' },
          },
        },
      ],
    };

    const videos: ChannelVideo[] = [];
    const seen = new Set<string>();
    extractVideosFromData(data, videos, seen);

    expect(videos).toHaveLength(1);
  });
});
