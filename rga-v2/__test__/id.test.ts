import { describe, it, expect } from 'vitest';
import { ClockId } from '../src/id';

describe('ClockId', () => {
  it('should generate unique IDs', () => {
    const clockId1 = new ClockId('client1');
    const id1 = clockId1.gen();
    const id2 = clockId1.gen();

    expect(id1).not.toBe(id2);
  });

  it('should update the clock and generate correct IDs', () => {
    const clockId = new ClockId('client1');
    const initialId = clockId.gen();
    const { clock: initialClock } = ClockId.extract(initialId);

    // clock 값을 증가시키기 위해 updateClock 호출
    clockId.updateClock(initialClock + 10);
    const updatedId = clockId.gen();
    const { clock: updatedClock } = ClockId.extract(updatedId);

    expect(updatedClock).toBe(initialClock + 11); // tick() 이후 값 증가 확인
  });

  it('should correctly extract client and clock from ID', () => {
    const clockId = new ClockId('client1');
    const id = clockId.gen();
    const { client, clock } = ClockId.extract(id);

    expect(client).toBe('client1');
    expect(clock).toBeGreaterThan(0);
  });

  it('should compare two IDs correctly', () => {
    const clockId1 = new ClockId('client1');
    const clockId2 = new ClockId('client2');

    const id1 = clockId1.gen();
    const id2 = clockId1.gen(); // clockId1에서 두 번째 ID 생성 (id1 < id2)

    const id3 = clockId2.gen(); // clockId2에서 첫 번째 ID 생성

    // 동일한 클라이언트에서 더 늦게 생성된 ID가 더 커야 함
    expect(ClockId.compare(id1, id2)).toBe(-1);
    expect(ClockId.compare(id2, id1)).toBe(1);

    // 다른 클라이언트에서 clock 값이 다르면 그에 따라 비교
    expect(ClockId.compare(id1, id3)).toBe(-1); // id1의 clock이 작을 가능성
  });

  it('should throw an error for invalid ID format', () => {
    expect(() => {
      ClockId.extract('invalid-id');
    }).toThrow('ID Type Error');
  });

  it('should throw an error for duplicate IDs', () => {
    const id = 'client1-1';
    expect(() => {
      ClockId.compare(id, id);
    }).toThrow('Duplicate ID');
  });
});
