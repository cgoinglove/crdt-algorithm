import { ID, Operation } from './interface';
import { LamportClock } from './lamport-clock';

const logicalClock = new LamportClock();

export const createId = (client: string): ID =>
  `${client}-${logicalClock.tick()}`;

export const extractId = (
  id: ID,
): {
  client: string;
  clock: number;
} => {
  const [client, clock] = id.split('-');
  if (typeof client != 'string' || isNaN(clock as unknown as number))
    throw new Error('ID Type Error');
  return {
    client,
    clock: +clock,
  };
};

export const updateClock = (clock: number) => logicalClock.update(clock);

export const compareId = (a: ID, b: ID): 1 | -1 => {
  const { client: aClient, clock: aClock } = extractId(a);
  const { client: bClient, clock: bClock } = extractId(b);

  if (aClock > bClock) return 1;
  if (aClock < bClock) return -1;
  if (aClient > bClient) return 1;
  if (aClient < bClient) return -1;
  throw new Error('Duplicate ID');
};

export const compareToken = (a: Operation, b: Operation) =>
  compareId(a.id, b.id);
