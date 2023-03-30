import { TodoItem } from '../models/TodoItem'

export interface TodoPagination {
  items: TodoItem[]
  nextKey: string
}
