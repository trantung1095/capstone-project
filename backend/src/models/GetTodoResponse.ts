import { TodoItem } from './TodoItem'

export interface GetTodosResponse {
  items: TodoItem[]
  nextKey: string
}
