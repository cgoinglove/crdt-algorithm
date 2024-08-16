import { describe, it, expect } from 'vitest';
import { LamportClock } from '../src/lamport-clock';

describe('LamportClock', () => {
  it('기본 시간은 0으로 초기화되어야 한다', () => {
    const clock = new LamportClock();
    expect(clock.getTime()).toBe(0);
  });

  it('tick이 호출되면 시간이 1 증가해야 한다', () => {
    const clock = new LamportClock();
    clock.tick();
    expect(clock.getTime()).toBe(1);
    clock.tick();
    expect(clock.getTime()).toBe(2);
  });

  it('더 큰 시간으로 update가 호출되면 시간이 올바르게 업데이트되어야 한다', () => {
    const clock = new LamportClock();
    clock.update(5);
    expect(clock.getTime()).toBe(5);
  });

  it('더 작은 시간으로 update가 호출되더라도 시간이 감소하지 않아야 한다', () => {
    const clock = new LamportClock();
    clock.update(5);
    expect(clock.getTime()).toBe(5);
    clock.update(3);
    expect(clock.getTime()).toBe(5);
  });

  it('tick과 update가 순차적으로 호출될 때 올바르게 처리되어야 한다', () => {
    const clock = new LamportClock();
    clock.tick();
    expect(clock.getTime()).toBe(1);
    clock.update(5);
    expect(clock.getTime()).toBe(5);
    clock.tick();
    expect(clock.getTime()).toBe(6);
  });
});
