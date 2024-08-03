type ID = number;

interface Node {
  id: ID;
  content: string;
  next?: Node; // children
}

interface Operation {
  type: 'insert' | 'delete';
  id: ID;
  parent?: ID;
  content?: string;
  clock: number;
  author: string;
}

interface CRDT {
  insert(content: string, parent?: ID): void;
  delete(id: ID): void;
  stringify(): string;
  merge(token: Operation | Operation[]): void;
}
