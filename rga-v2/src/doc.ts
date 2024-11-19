import { ClockId } from './id';
import { ID, Operation, RGA } from './interface';
import { Node } from './node';
import { OperationToken } from './operation-token';

const compareToken = (a: Operation, b: Operation) =>
  ClockId.compare(a.id, b.id);

const NODE_ROOT_ID = 'DOC_ROOT';

export class Doc<T> implements RGA<T> {
  private head!: Node<Operation<T>>;
  private staging!: Operation[];
  private clock!: ClockId;
  private buffer!: Operation[];
  private operations!: {
    insert: Map<
      ID,
      {
        operation: Operation;
        children: Operation[];
      }
    >;
    delete: Set<ID>;
  };
  constructor(public readonly client: string) {
    this.init();
  }
  init() {
    const root = OperationToken.ofInsert({
      id: NODE_ROOT_ID,
    });
    const head = new Node<Operation<T>>(root);
    head.softDelete();
    this.head = head;
    this.buffer = [];
    this.operations = {
      insert: new Map(),
      delete: new Set(),
    };
    this.operations.insert.set(NODE_ROOT_ID, {
      children: [],
      operation: root,
    });
    this.staging = [];
    this.clock = new ClockId(this.client);
  }
  private recordOperation(operation: Operation<T>) {
    switch (operation.type) {
      case 'insert':
        this.operations.insert.set(operation.id, {
          operation,
          children: [],
        });
        const parentId = operation.parent ?? NODE_ROOT_ID;
        const parent = this.operations.insert.get(parentId)!;
        parent.children.push(operation);
        parent.children.sort(compareToken);
        this.operations.insert.set(parentId, parent);
        break;
      case 'delete':
        this.operations.delete.add(operation.id);
        break;
    }
  }
  private canProcessOperation(operation: Operation<T>): boolean {
    switch (operation.type) {
      case 'insert':
        return (
          !operation.parent || this.operations.insert.has(operation.parent)
        );
      case 'delete':
        return this.operations.insert.has(operation.id);
      default:
        return false;
    }
  }
  private resolveConflict(operation: Operation<T>): Operation<T> | undefined {
    const op = OperationToken.copy(operation);
    switch (operation.type) {
      case 'insert': {
        const duplicate = this.operations.insert.get(
          op.parent ?? NODE_ROOT_ID,
        )?.children;
        if (!duplicate) throw new Error('Not Found Node');
        const parent = duplicate.find(dp => compareToken(op, dp) == -1);
        if (parent) {
          op.parent = parent.id;
          return this.resolveConflict(op);
        }
        return op;
      }
      case 'delete': {
        if (this.operations.delete.has(operation.id)) return undefined;
      }
    }
    return op;
  }
  private apply(operation: Operation<T>) {
    const resolve = this.resolveConflict(operation);
    if (!resolve) return;

    switch (resolve.type) {
      case 'delete': {
        this.head.find(node => node.value.id == resolve.id)!.softDelete();
        break;
      }
      case 'insert': {
        let parent: Node<Operation<T>> | undefined;
        if (!resolve.parent) {
          parent = this.head;
        } else {
          parent = this.head.find(node => node.value.id == resolve.parent);
        }
        if (!parent) throw new Error(`Not Found Node`);
        parent.append(new Node<Operation<T>>(operation));
      }
    }

    this.recordOperation(operation);
  }

  insert(value: T, parent?: ID) {
    const operation = OperationToken.ofInsert({
      id: this.clock.gen(),
      value,
      parent,
    });
    this.apply(operation);
    this.staging.push(operation);
    return operation;
  }
  delete(id: ID) {
    const operation = OperationToken.ofDelete<T>({
      id,
    });
    this.apply(operation);
    this.staging.push(operation);
    return operation;
  }
  merge(operations: Operation<T>[]): void {
    this.clock.updateClock(
      Math.max(...operations.map(op => ClockId.extract(op.id).clock)),
    );
    [...operations.sort(compareToken), ...this.buffer.splice(0)].forEach(
      operation => {
        if (!this.canProcessOperation(operation)) {
          this.buffer.push(operation);
          return;
        }
        this.apply(operation);
      },
    );
  }

  commit() {
    const operations = this.staging.splice(0);
    const groupByType = operations.reduce(
      (prev, cur) => {
        prev[cur.type].set(cur.id, cur);
        return prev;
      },
      {
        delete: new Map(),
        insert: new Map(),
      } as Record<Operation['type'], Map<ID, Operation>>,
    );

    Array.from(groupByType.insert.values())
      .reverse()
      .forEach(op => {
        if (groupByType.delete.has(op.id)) {
          groupByType.delete.delete(op.id);
          groupByType.insert.delete(op.id);
          this.head.find(node => node.value.id == op.id)?.delete();
        }
      });
    return [
      ...Array.from(groupByType.insert.values()),
      ...Array.from(groupByType.delete.values()),
    ];
  }

  list(): Node<Operation<T>>[] {
    const list: Node<Operation<T>>[] = [];
    let node: Node<Operation<T>> | undefined = this.head;
    while (node) {
      if (!node.deleted) list.push(node);
      node = node.right;
    }
    return list;
  }
}
