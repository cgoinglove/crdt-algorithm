import { autoIncrement } from '@repo/shared';
import { LamportClock } from './lamport-clock';

type RandomIdGenerate = () => string;

const randomId: RandomIdGenerate = () => autoIncrement().toString();

const logicalClock = new LamportClock();

export const createId = (): ID => `${randomId()}-${logicalClock.tick()}`;

export const updateClock = (clock: number) => logicalClock.update(clock);

export const compare = (a: ID, b: ID): 1 | -1 => {
  const [aNode, aClock] = a.split('-');
  const [bNode, bClock] = a.split('-');

  if (aClock > bClock) return 1;
  if (aClock < bClock) return -1;
  if (aNode > bNode) return 1;
  if (aNode < bNode) return -1;

  throw new Error('Duplicate ID');
};
