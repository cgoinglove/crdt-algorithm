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
  readonly document: Map<ID, Node>;
  insert(content: Node['content'], left?: ID): ID;
  update(id:ID,content:string): void;
  remove(id: ID): void;
  split(id: ID, index: number):Node;
  stringify(): string;
  commit(): void | Promise<void>;
  merge(token: Operation | Operation[]): void;
}
