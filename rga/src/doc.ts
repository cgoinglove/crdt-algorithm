import { ClockId } from './id'
import { ID, Operation, RGA } from './interface'
import { Node } from './node'
import { OperationToken } from './operation-token'

const compareToken = (a: Operation, b: Operation) => {
  if (a.id == b.id && a.type != b.type) {
    return a.type == 'insert' ? 1 : -1
  }

  return ClockId.compare(a.id, b.id)
}

const ROOT_NODE_ID = 'DOC_ROOT'

export class Doc<T> implements RGA<T> {
  private head!: Node<Operation<T>>
  private staging!: Operation[]
  private clock!: ClockId
  private buffer!: Operation[]
  private operations!: {
    insert: Map<
      ID,
      {
        operation: Operation
        children: Operation[]
      }
    >
    delete: Set<ID>
  }
  constructor(public readonly client: string) {
    this.init()
  }
  init() {
    const root = OperationToken.ofInsert({
      id: ROOT_NODE_ID,
    })
    const head = new Node<Operation<T>>(root)
    head.softDelete()
    this.head = head
    this.buffer = []
    this.operations = {
      insert: new Map(),
      delete: new Set(),
    }
    this.operations.insert.set(ROOT_NODE_ID, {
      children: [],
      operation: root,
    })
    this.staging = []
    this.clock = new ClockId(this.client)
  }
  private recordOperation(operation: Operation<T>) {
    switch (operation.type) {
      case 'insert':
        this.operations.insert.set(operation.id, {
          operation,
          children: [],
        })
        const parentId = operation.parent ?? ROOT_NODE_ID
        const parent = this.operations.insert.get(parentId)!
        parent.children.push(operation)
        parent.children.sort(compareToken)
        this.operations.insert.set(parentId, parent)
        break
      case 'delete':
        this.operations.delete.add(operation.id)
        break
    }
  }
  private canProcessOperation(operation: Operation<T>): boolean {
    switch (operation.type) {
      case 'insert':
        return !operation.parent || this.operations.insert.has(operation.parent)
      case 'delete':
        return this.operations.insert.has(operation.id)
      default:
        return false
    }
  }
  private resolveConflict(operation: Operation<T>): Operation<T> | undefined {
    const resolveOperation = OperationToken.clone(operation)
    switch (operation.type) {
      case 'insert': {
        if (this.operations.insert.has(operation.id)) return undefined
        const duplicate = this.operations.insert.get(resolveOperation.parent ?? ROOT_NODE_ID)?.children
        if (!duplicate) throw new Error('Not Found Node')
        const parent = duplicate.find(dp => compareToken(resolveOperation, dp) == -1)
        if (parent) {
          resolveOperation.parent = parent.id
          return this.resolveConflict(resolveOperation)
        }
        return resolveOperation
      }
      case 'delete': {
        if (this.operations.delete.has(operation.id)) return undefined
      }
    }
    return resolveOperation
  }
  private apply(operation: Operation<T>) {
    const resolvedOperation = this.resolveConflict(operation)
    if (!resolvedOperation) return

    switch (resolvedOperation.type) {
      case 'delete': {
        this.head.find(node => node.value.id == resolvedOperation.id)!.softDelete()
        break
      }
      case 'insert': {
        let parent: Node<Operation<T>> | undefined
        if (!resolvedOperation.parent) {
          parent = this.head
        } else {
          parent = this.head.find(node => node.value.id == resolvedOperation.parent)
        }
        if (!parent) throw new Error(`Not Found Node`)
        parent.append(new Node<Operation<T>>(operation))
      }
    }

    this.recordOperation(operation)
  }

  insert(value: T, parent?: ID) {
    const operation = OperationToken.ofInsert({
      id: this.clock.gen(),
      value,
      parent,
    })
    this.apply(operation)
    this.staging.push(operation)
    return operation
  }
  delete(id: ID) {
    const operation = OperationToken.ofDelete<T>({
      id,
    })
    this.apply(operation)
    this.staging.push(operation)
    return operation
  }
  merge(operations: Operation<T>[]): void {
    const clocks = operations.map(op => ClockId.extract(op.id).clock)
    const maxClock = Math.max(...clocks)
    this.clock.updateClock(maxClock)
    const buffueredOperations = this.buffer.splice(0)
    const targets = [...operations, ...buffueredOperations].sort(compareToken)
    targets.forEach(operation => {
      if (!this.canProcessOperation(operation)) {
        this.buffer.push(operation)
        return
      }
      this.apply(operation)
    })
  }

  commit() {
    const operations = this.staging.splice(0)
    const groupByType = operations.reduce(
      (prev, cur) => {
        prev[cur.type].set(cur.id, cur)
        return prev
      },
      {
        delete: new Map(),
        insert: new Map(),
      } as Record<Operation['type'], Map<ID, Operation>>,
    )

    Array.from(groupByType.insert.values())
      .reverse()
      .forEach(op => {
        if (groupByType.delete.has(op.id)) {
          groupByType.delete.delete(op.id)
          groupByType.insert.delete(op.id)
          this.head.find(node => node.value.id == op.id)?.delete()
        }
      })

    return [...Array.from(groupByType.insert.values()), ...Array.from(groupByType.delete.values())]
  }

  list(): Node<Operation<T>>[] {
    const list: Node<Operation<T>>[] = []
    let node: Node<Operation<T>> | undefined = this.head
    while (node) {
      if (!node.deleted) list.push(node)
      node = node.right
    }
    return list
  }
}
