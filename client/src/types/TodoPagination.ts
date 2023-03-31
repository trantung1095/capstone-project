import { Todo } from './Todo'

export interface TodoPagination {
  items: Todo[]
  nextKey?: string
}
