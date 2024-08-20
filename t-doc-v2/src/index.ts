import { compareToken, createId, extractId, updateClock } from './id';
import { createNodeManager, Node } from './node';
import { OperationToken } from './operation-token';

export type preCommit<T = any> = (
  operations: Operation[],
  rollback: () => void,
) => T;

export class Doc<T = Operation[]> implements RGA {
  private head: Node | undefined;
  private nodeManager: ReturnType<typeof createNodeManager>;
  private staging: Operation[];
  // for undo
  private histories: Operation[];

  constructor(
    public readonly client: string,
    private preCommit?: preCommit<T>,
  ) {
    this.nodeManager = createNodeManager();
    this.staging = [];
    this.histories = [];
  }
  private findNode(id: ID): Node | undefined {
    return this.nodeManager.find(id);
  }

  private applyInsert(operation: Operation) {
    const parent = this.findNode(operation.parent!);
    if (operation.parent && !parent) throw new Error('Not Found Parent');
    const newNode: Node = this.nodeManager.create(
      operation.id,
      operation.content!,
    );
    if (parent) return parent.append(newNode);
    if (this.head) newNode.append(this.head);
    this.head = newNode;
  }
  private applyDelete(operation: Operation): void {
    const target = this.findNode(operation.id);
    if (!target) throw new Error('Not Found Node');
    target.delete();
  }
  private addStage(token: Operation) {
    if (token.type == 'delete') {
      const index = this.staging.findIndex(
        op => op.type == 'insert' && op.id == token.id,
      );
      if (index != -1) {
        this.staging.splice(index, 1);
        this.nodeManager.forceDelete(token.id);
        this.histories.push(token);
        return;
      }
    }
    this.staging.push(token);
    this.histories.push(token);
  }
  undo(depth: number = 1) {
    'undo';
  }
  commit(): T {
    const tokens = this.staging.splice(-this.staging.length);

    const rollback = () => {
      this.staging.unshift(...tokens);
    };

    if (this.preCommit) return this.preCommit(tokens, rollback);
    return tokens as T;
  }
  insert(content: string, parent?: ID): Operation {
    const token = OperationToken.ofInsert({
      id: createId(this.client),
      content,
      parent,
    });
    this.applyInsert(token);
    this.addStage(token);
    return token;
  }
  delete(id: ID): Operation {
    const token = OperationToken.ofDelete({
      id,
    });
    this.applyDelete(token);
    this.addStage(token);
    return token;
  }
  stringify(): string {
    let node = this.head;
    let result = '';
    while (node) {
      if (!node.deleted) result += node.value;
      node = node.right;
    }
    return result;
  }

  private conflictResolution(tokens: Operation[]): Operation[] {
    return tokens;
    // const insertConflictTokens = this.commitLogs
    //   .flat()
    //   .reduce<{ [parentId: ID]: Operation[] }>((prev, node) => {
    //     const parent = node.parent;
    //     prev[parent as ID] ??= [];
    //     prev[parent as ID].push(node);
    //     return prev;
    //   }, {});
    // return tokens.filter(token => {
    //   switch (token.type) {
    //     case 'delete': {
    //       const duplicateOperation = this.staging.delete.has(token.id);
    //       if (duplicateOperation) {
    //         this.staging.delete.delete(token.id);
    //         return false;
    //       }
    //       break;
    //     }
    //     case 'insert':
    //       {
    //         console.log(insertConflictTokens);
    //         const conflict = insertConflictTokens[token.parent as ID];
    //         if (conflict) {
    //           console.log(`${this.client} conflict 발생`, { conflict, token });
    //           token.parent = this.findParentNode(
    //             conflict.find(compareToken.bind(null, token))!.id,
    //           )?.id;
    //           console.log(token.parent, 'token.parent');
    //         }
    //       }
    //       break;
    //   }

    //   return token;
    // });
  }

  merge(token: Operation | Operation[]): void {
    const tokens = [token].flat().sort(compareToken);
    if (!tokens.length) return;

    const lastClock = extractId(tokens.at(-1)!.id).clock;
    updateClock(lastClock);

    const resolveTokens = this.conflictResolution(tokens);
    resolveTokens.forEach(op => {
      switch (op.type) {
        case 'delete':
          this.applyDelete(op);
          break;
        case 'insert':
          this.applyInsert(op);
          break;
      }
    });
  }
}
