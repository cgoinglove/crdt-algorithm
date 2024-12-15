/**
 * @deprecated
 */
export interface Command {
  executed: boolean
  execute(...args: any[]): any
  undo(...args: any[]): any
}
/**
 * `${string}::${number}`
 */
export type ID = string

export interface Operation<Item = any> {
  type: 'insert' | 'delete'
  id: ID
  parent?: ID
  value?: Item
}

export interface RGA<Item> {
  insert(value: Item, parent?: ID): Operation<Item>
  delete(id: ID): Operation<Item>
  merge(operations: Operation<Item>[]): void
  commit(): Operation<Item>[]
}
