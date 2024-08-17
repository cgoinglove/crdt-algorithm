import { describe, it, expect, vi } from 'vitest';
import { createId, extractId, compareId } from '../src/id';
import { LamportClock } from '../src/lamport-clock';

vi.mock('@repo/shared', () => ({
  autoIncrement: vi.fn().mockReturnValue(1),
}));

describe('ID Generation and Handling', () => {
  it('createId는 랜덤 ID와 LamportClock의 값을 결합한 문자열을 생성해야 한다', () => {
    const clock = new LamportClock();
    const id = createId();

    const [nodeId, clockValue] = id.split('-');
    expect(nodeId).toBe('1'); // autoIncrement 모킹 값
    expect(+clockValue).toBe(clock.tick()); // LamportClock의 tick 값
  });

  it('extractId는 nodeId와 clock을 분리하여 반환해야 한다', () => {
    const id = 'node-123';
    const result = extractId(id);

    expect(result).toEqual({
      nodeId: 'node',
      clock: 123,
    });
  });

  it('extractId는 잘못된 ID 형식일 때 오류를 발생시켜야 한다', () => {
    const invalidId = 'invalid-id';
    expect(() => extractId(invalidId as ID)).toThrow('ID Type Error');
  });

  it('compareId는 clock 값을 기준으로 ID를 비교해야 한다', () => {
    const id1 = 'node1-10';
    const id2 = 'node2-15';

    expect(compareId(id1, id2)).toBe(-1);
    expect(compareId(id2, id1)).toBe(1);
  });

  it('compareId는 nodeId 값이 같은 clock에서 비교되어야 한다', () => {
    const id1 = 'node1-10';
    const id2 = 'node2-10';

    expect(compareId(id1, id2)).toBe(-1);
    expect(compareId(id2, id1)).toBe(1);
  });

  it('compareId는 중복된 ID일 때 오류를 발생시켜야 한다', () => {
    const id1 = 'node1-10';
    const id2 = 'node1-10';

    expect(() => compareId(id1, id2)).toThrow('Duplicate ID');
  });
});
