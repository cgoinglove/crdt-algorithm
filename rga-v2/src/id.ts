import { ID } from './interface';
import { LamportClock } from './lamport-clock';

export class ClockId {
  private clock: LamportClock;

  constructor(public readonly clientId: string) {
    this.clock = new LamportClock();
  }

  gen(): ID {
    return `${this.clientId}-${this.clock.tick()}`;
  }
  updateClock(time: number) {
    this.clock.update(time);
  }

  static extract(id: string) {
    const [client, clock] = id.split('-');
    if (typeof client != 'string' || isNaN(clock as unknown as number))
      throw new Error('ID Type Error');
    return {
      client,
      clock: +clock,
    };
  }
  static compare(a: string, b: string): 1 | -1 {
    const { client: aClient, clock: aClock } = ClockId.extract(a);
    const { client: bClient, clock: bClock } = ClockId.extract(b);
    if (aClock > bClock) return 1;
    if (aClock < bClock) return -1;
    if (aClient > bClient) return 1;
    if (aClient < bClient) return -1;
    throw new Error('Duplicate ID');
  }
}
