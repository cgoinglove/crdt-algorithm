import { autoIncrement } from '@repo/shared';
import { LamportClock } from './lamport-clock';

type RandomIdGenerate = () => string;

const randomId: RandomIdGenerate = () => autoIncrement().toString();

const logicalClock = new LamportClock();

export const createId = (): ID => `${randomId()}-${logicalClock.tick()}`;

export const extractId = (
  id: ID,
): {
  nodeId: string;
  clock: number;
} => {
  const [nodeId, clock] = id.split('-');
  if (typeof nodeId != 'string' || isNaN(clock as unknown as number))
    throw new Error('ID Type Error');
  return {
    nodeId,
    clock: +clock,
  };
};

export const updateClock = (clock: number) => logicalClock.update(clock);

export const compareId = (a: ID, b: ID): 1 | -1 => {
  const { nodeId: aNode, clock: aClock } = extractId(a);
  const { nodeId: bNode, clock: bClock } = extractId(b);

  if (aClock > bClock) return 1;
  if (aClock < bClock) return -1;
  if (aNode > bNode) return 1;
  if (aNode < bNode) return -1;

  throw new Error('Duplicate ID');
};

export const compareToken = (a: Operation, b: Operation) =>
  compareId(a.id, b.id);
