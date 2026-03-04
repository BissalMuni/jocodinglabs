import { describe, it, expect } from 'vitest';
import { parseTimestamps, formatTimestampsForAnalysis } from './video-description';

describe('parseTimestamps', () => {
  it('표준 타임스탬프를 파싱한다', () => {
    const desc = `00:00 인트로
01:23 GPT-5 출시
05:40 Claude Opus 4
10:15 마무리`;

    const result = parseTimestamps(desc);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ time: '00:00', label: '인트로' });
    expect(result[1]).toEqual({ time: '01:23', label: 'GPT-5 출시' });
    expect(result[2]).toEqual({ time: '05:40', label: 'Claude Opus 4' });
  });

  it('시:분:초 형식도 파싱한다', () => {
    const desc = '1:05:30 긴 영상 마무리';
    const result = parseTimestamps(desc);
    expect(result).toHaveLength(1);
    expect(result[0].time).toBe('1:05:30');
  });

  it('타임스탬프가 없으면 빈 배열', () => {
    const desc = '이 영상에서는 AI 기술을 소개합니다.\n구독 좋아요 부탁드려요.';
    const result = parseTimestamps(desc);
    expect(result).toHaveLength(0);
  });

  it('타임스탬프와 일반 텍스트 혼합', () => {
    const desc = `AI뉴스 모음입니다.

00:00 인트로
구독 좋아요!
02:30 Sora 2 출시
링크: https://example.com
05:00 마무리`;

    const result = parseTimestamps(desc);
    expect(result).toHaveLength(3);
    expect(result[1].label).toBe('Sora 2 출시');
  });
});

describe('formatTimestampsForAnalysis', () => {
  it('타임스탬프를 분석용 문자열로 포맷한다', () => {
    const timestamps = [
      { time: '00:00', label: '인트로' },
      { time: '01:23', label: 'GPT-5' },
    ];
    const result = formatTimestampsForAnalysis(timestamps);
    expect(result).toContain('영상 목차');
    expect(result).toContain('[00:00] 인트로');
    expect(result).toContain('[01:23] GPT-5');
  });

  it('빈 배열이면 빈 문자열', () => {
    expect(formatTimestampsForAnalysis([])).toBe('');
  });
});
