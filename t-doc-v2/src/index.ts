import { compareToken, createId, extractId, updateClock } from './id';

import { OperationToken } from './operation-token';

export type CommitHandler<T = any> = (
  operations: Operation[],
  rollback: () => void,
) => T;

export class Doc<T = Operation[]> implements RGA {
  private document: Node<string> | undefined;
  private pendingTokens: Record<Operation['type'], Map<ID, Operation>>;
  // for undo
  private histories: Operation[];

  constructor(private commitHandler?: CommitHandler<T>) {
    this.pendingTokens = {
      insert: new Map(),
      delete: new Map(),
    };
    this.histories = [];
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
    const parent = this.getNode(operation.parent!);
    if (operation.parent && !parent) throw new Error('Not Found Parent');
    const newNode: Node = {
      content: operation.content!,
      id: operation.id,
      next: parent ? parent.next : this.document,
    };
    if (parent) parent.next = newNode;
    else this.document = newNode;
  }

  private _delete(node: Operation): void {
    const parent = this.getParent(node.id) || { next: this.document };
    const currentNode = parent?.next;
    if (!currentNode) return;
    // is Root
    if (this.document == currentNode) this.document = this.document.next;
    else parent!.next = currentNode.next;
  }
  private addToken(token: Operation) {
    if (token.type == 'delete' && this.pendingTokens.insert.has(token.id))
      this.pendingTokens.insert.delete(token.id);
    else this.pendingTokens[token.type].set(token.id, token);

    this.histories.push(token);
  }
  undo() {
    'undo';
  }
  commit(): T {
    const histories = this.histories.splice(-this.histories.length);

    const insertTokens = Array.from(this.pendingTokens.insert.values());
    this.pendingTokens.insert.clear();
    const deleteTokens = Array.from(this.pendingTokens.delete.values());
    this.pendingTokens.delete.clear();

    const list = [...insertTokens, ...deleteTokens].sort(compareToken);

    const rollback = () => {
      insertTokens.forEach(token =>
        this.pendingTokens.insert.set(token.id, token),
      );
      deleteTokens.forEach(token =>
        this.pendingTokens.delete.set(token.id, token),
      );
      this.histories.unshift(...histories);
    };

    if (this.commitHandler) return this.commitHandler(list, rollback);
    return list as T;
  }
  insert(content: string, parent?: ID): Operation {
    const token = OperationToken.ofInsert({
      id: createId(),
      content,
      parent,
    });
    this._insert(token);
    this.addToken(token);
    return token;
  }
  delete(id: ID): Operation {
    const token = OperationToken.ofDelete({
      id,
    });
    this._delete(token);
    this.addToken(token);
    return token;
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

  private resolveConflicts(tokens: Operation[]): Operation[] {
    const mergeDeleteToken = new Map<ID, Operation>();
    this.pendingTokens.delete.entries().forEach(([key, value]) => {
      mergeDeleteToken.set(key, value);
    });

    tokens.forEach(token => {
      if (token.type == 'delete') mergeDeleteToken.set(token.id, token);
    });

    return tokens.filter(token => {
      switch (token.type) {
        case 'delete': {
          const duplicateOperation = this.pendingTokens.delete.has(token.id);
          if (duplicateOperation) {
            this.pendingTokens.delete.delete(token.id);
            return false;
          }
          break;
        }
        case 'insert':
          {
            while (mergeDeleteToken.has(token.parent!)) {
              token.parent = mergeDeleteToken.get(token.parent!)?.parent;
            }

            const duplicateParentOperation = Array.from(
              this.pendingTokens.insert.values(),
            )
              .filter(pt => {
                pt.parent == token.parent;
              })
              .sort(compareToken);

            if (duplicateParentOperation.length)
              token.parent = duplicateParentOperation.find(pt =>
                compareToken(pt, token),
              )?.parent;
          }
          break;
      }

      return token;
    });
  }

  merge(token: Operation | Operation[]): void {
    const tokens = [token].flat().sort(compareToken);

    const lastClock = extractId(tokens.at(-1)!.id).clock;
    updateClock(lastClock);

    const resolveTokens = this.resolveConflicts(tokens);
    resolveTokens.forEach(op => {
      switch (op.type) {
        case 'delete':
          this._delete(op);
          break;
        case 'insert':
          this._insert(op);
          break;
      }
    });
  }
}
