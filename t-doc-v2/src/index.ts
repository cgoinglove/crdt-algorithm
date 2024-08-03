import { autoIncrement } from '@repo/shared';

const generateId: () => ID = autoIncrement;

const generateClock: () => Operation['clock'] = autoIncrement;

export type CommitHandler<T = any> = (
  operations: OperationToken[],
  rollback: () => void,
) => T;

export class OperationToken implements Operation {
  private constructor(
    public type: Operation['type'],
    public id: Operation['id'],
    public author: Operation['author'],
    public clock: Operation['clock'],
    public content?: Operation['content'],
    public parent?: Operation['parent'],
  ) {}

  static ofInsert(operation: Pick<Operation, 'author' | 'content' | 'parent'>) {
    return new OperationToken(
      'insert',
      generateId(),
      operation.author,
      generateClock(),
      operation.content,
      operation.parent,
    );
  }
  static ofDelete(operation: Pick<Operation, 'author' | 'id'>) {
    return new OperationToken(
      'delete',
      operation.id,
      operation.author,
      generateClock(),
    );
  }
  static hash(token: Operation): string {
    const args: any[] = [token.type, token.id, token.author, token.clock];
    if (token.type == 'insert') args.push(token.content, token.parent);
    return JSON.stringify(args);
  }
  static fromHash(hash: string): OperationToken {
    const [type, id, author, clock, content, parent] = JSON.parse(hash);
    switch (type as Operation['type']) {
      case 'insert':
        return new OperationToken(type, id, author, clock, content, parent);
      case 'delete':
        return new OperationToken(type, id, author, clock);
      default:
        throw new Error('TypeError');
    }
  }
}

export class DocumentOperator<T = OperationToken[]> implements CRDT {
  private document: Node | undefined;
  private pendingTokens: OperationToken[] = [];
  // for undo
  private histories: OperationToken[] = [];

  constructor(
    private clientID: string,
    private commitHandler?: CommitHandler<T>,
  ) {}

  private getParent(id: ID): Node | undefined {
    if (this.document?.id == id) return undefined;
    let current: Node | undefined = this.document;
    while (current?.next) {
      if (current.next.id == id) return current;
      if (current.id == id) return;
      current = current.next;
    }
  }

  private getNode(id: ID): Node | undefined {
    if (id == this.document?.id) return this.document;
    return this.getParent(id)?.next;
  }

  private _insert(operation: OperationToken) {
    const parent = this.getParent(operation.id!);
    if (this.document && !parent) throw new Error('잘못된 경로');

    const newNode: Node = {
      content: operation.content!,
      id: operation.id,
      next: parent?.next,
    };
    if (parent) parent.next = newNode;
    else this.document = newNode;
  }

  private _delete(node: Operation): void {
    const parent = this.getParent(node.id);
    const currentNode = parent?.next;
    if (this.document && !parent) throw new Error('잘못된 경로');
    if (!currentNode) return;
    // is Root
    if (this.document == currentNode) this.document = undefined;
    else parent!.next = currentNode.next;
  }
  private addToken(token: OperationToken) {
    this.pendingTokens.push(token);
    // max histories 10;
    this.histories = [...this.histories.slice(0, 9), token];
  }

  commit(): T {
    const operations = this.pendingTokens.splice(-this.pendingTokens.length);
    //@todo operations duplicate 작업  insert 한걸 delete 한 경우 와 같이
    const rollback = () => this.pendingTokens.unshift(...operations);
    if (this.commitHandler)
      return this.commitHandler(this.pendingTokens, rollback);
    return operations as T;
  }
  insert(content: string, parent?: ID) {
    const token = OperationToken.ofInsert({
      author: this.clientID,
      content,
      parent,
    });
    this._insert(token);
    this.addToken(token);
  }
  delete(id: ID) {
    const token = OperationToken.ofDelete({
      author: this.clientID,
      id,
    });
    this._delete(token);
    this.addToken(token);
  }
  stringify(): string {
    let node = this.document;
    let result = '';
    while (node) {
      result += node.content;
      node = node.next;
    }
    return result;
  }
  merge(token: OperationToken | OperationToken[]): void {
    const tokens = [token].flat();
    tokens.forEach(op => {
      switch (op.type) {
        case 'insert':
          this._insert(op);
          break;
        case 'delete':
          this._delete(op);
          break;
      }
    });
  }
}
