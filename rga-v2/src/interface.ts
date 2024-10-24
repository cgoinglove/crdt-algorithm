import { Node } from './node';

export interface Command {
  executed: boolean;
  execute(...args: any[]): any;
  undo(...args: any[]): any;
}

export type ID = string; //`${client}-${number}`

export interface Operation<Item = any> {
  type: 'insert' | 'delete';
  id: ID;
  parent?: ID;
  value?: Item;
}

export interface Commit<Item> {
  version: string;
  author: string;
  timestamp: number;
  operations: Operation<Item>[];
}

export interface RGA<Item> {
  head?: Node<Item>;
  histories: Command[];
  insert(value: Item, parent?: ID): void;
  update(id: ID, value: Item): void;
  delete(id: ID): void;
  pull(commits: Commit<Item> | Commit<Item>[]): void;
  push(): Commit<Item>;
}
