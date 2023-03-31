import { TodosAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'
import { TodoPagination } from '../models/TodoPagination'

const todoAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()
const logger = createLogger('todos')

export async function createTodo(
  model: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  logger.info('Create to do user id', userId)

  const todoId = uuidv4()
  const createdDate = new Date().toISOString()
  const newItem = {} as TodoItem
  newItem.todoId = todoId
  newItem.createdAt = createdDate
  newItem.done = false
  newItem.userId = userId
  newItem.name = model.name
  newItem.dueDate = model.dueDate

  return await todoAccess.createTodo(newItem)
}

export async function getTodosForUser(
  userId: string,
  limit: number,
  key: any
): Promise<TodoPagination> {
  logger.info('Get to do user id', userId)

  return await todoAccess.getTodos(userId, limit, key)
}

export async function deleteTodo(todoId: string, userId: string) {
  logger.info('Delete todo id')
  logger.info(todoId)

  await deleteImageTodo(todoId, userId)
  await todoAccess.deleteTodo(todoId, userId)
}

export async function updateTodo(
  todoId: string,
  userId: string,
  model: UpdateTodoRequest
) {
  logger.info('Update todo id')

  // Check if update image, delete old image
  if (model.isUpdateImage) {
    await deleteImageTodo(todoId, userId)
  }

  await todoAccess.updateTodo(todoId, userId, model)
}

export async function deleteImageTodo(todoId: string, userId: string) {
  logger.info('Check delete image todo')

  const toDo = await todoAccess.getTodo(todoId, userId)
  logger.info(toDo)

  if (
    toDo.imageId !== undefined &&
    toDo.imageId !== null &&
    toDo.imageId !== ''
  ) {
    logger.info('Delete image todo')

    // Delete old image
    await attachmentUtils.deleteImageFile(toDo.imageId)
    await todoAccess.updateImageSourceToDo(todoId, userId, '')
  }
}

export async function createAttachmentPresignedUrl(
  todoId: string,
  userId: string
): Promise<string> {
  logger.info('create attachment presigned url')

  // Random image id
  const imageId = uuidv4()

  // Save to db
  await todoAccess.updateImageSourceToDo(todoId, userId, imageId)

  // Get upload url
  return await attachmentUtils.getSignedUrl(imageId)
}
