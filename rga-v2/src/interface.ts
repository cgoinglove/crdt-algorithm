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
export interface RGA<Item> {
  insert(value: Item, parent?: ID): Operation<Item>;
  delete(id: ID): Operation<Item>;
  pull(operations: Operation<Item>[]): void;
  push(): Operation<Item>[];
}
