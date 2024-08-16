import { createId } from './id';
import { LamportClock } from './lamport-clock';
import { OperationToken } from './operation-token';

export type CommitHandler<T = any> = (
  operations: Operation[],
  rollback: () => void,
) => T;

export class Doc<T = Operation[]> implements RGA {
  private document: Node<string> | undefined;
  private pendingTokens: Operation[];
  // for undo
  private histories: Operation[];
  private logicalClock: LamportClock;

  constructor(private commitHandler?: CommitHandler<T>) {
    this.pendingTokens = [];
    this.histories = [];
    this.logicalClock = new LamportClock();
  }

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

  private _insert(operation: Operation) {
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
  private addToken(token: Operation) {
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
      id: createId(),
      content,
      parent,
    });
    this._insert(token);
    this.addToken(token);
  }
  delete(id: ID) {
    const token = OperationToken.ofDelete({
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
  merge(token: Operation | Operation[]): void {
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
