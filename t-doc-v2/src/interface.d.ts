type ID = number;

interface Node {
  id: ID;
  left?: ID;
  right?: ID;
  content: string;
  author: string;
}

interface Operation {
  type: 'insert' | 'remove' | 'update';
  node: Node & { content?: Node['content'] };
  timestamp: number;
}

interface CRDT {
  insert(node: Node): void;
  update(node: Node): void;
  remove(id: ID): void;
  split(id: ID, index: number): void;
  stringify(): string;
  merge(token: Operation | Operation[]): void;
  commit(): Operation[];
}
