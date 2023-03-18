import { Todo } from './Todo'

export interface GetTodosResponse {
  items: Todo[]
  nextKey?: string
}
