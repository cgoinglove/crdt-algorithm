export type ID = `${string}-${number}`;

export interface Operation {
  type: 'insert' | 'delete';
  id: ID;
  parent?: ID;
  content?: string;
}

export interface RGA {
  insert(content: string, parent?: ID): void;
  delete(id: ID): void;
  stringify(): string;
  merge(token: Operation | Operation[]): void;
}