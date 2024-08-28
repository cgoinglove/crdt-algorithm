export type ID = `${string}-${number}`;

export interface Operation<Item = string> {
  type: 'insert' | 'delete';
  id: ID;
  parent?: ID;
  content?: Item;
}

export interface RGA<Item> {
  insert(content: Item, parent?: ID): Operation;
  delete(id: ID): void;
  stringify(): string;
  merge(token: Operation<Item> | Operation<Item>[]): void;
  commit(): Operation<Item>[];
}
