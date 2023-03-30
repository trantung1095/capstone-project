import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const logger = createLogger('todos')
const todoAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

import { v4 as uuidv4 } from 'uuid'
import { GetTodosResponse } from '../models/GetTodoResponse'

export async function getTodosForUser(
  userId: string,
  nextKey: any,
  limit: number,
  orderBy: string
): Promise<GetTodosResponse> {
  logger.info(`Get todo for user: ${userId}`)

  return await todoAccess.getTodos(userId, nextKey, limit, orderBy)
}

// TODO: Implement businessLogic
export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  logger.info(`Create todo for user: ${userId}`)

  const newItem: TodoItem = {} as TodoItem
  newItem.userId = userId
  newItem.todoId = uuidv4()
  newItem.createdAt = new Date().toISOString()
  newItem.name = createTodoRequest.name
  newItem.dueDate = createTodoRequest.dueDate
  newItem.done = false

  return await todoAccess.createTodo(newItem)
}

export async function updateTodo(
  todoId: string,
  userId: string,
  UpdateTodoRequest: UpdateTodoRequest
) {
  logger.info(`Update todo for user: ${userId}`)

  await todoAccess.updateTodo(todoId, userId, UpdateTodoRequest)
}

export async function deleteTodo(todoId: string, userId: string) {
  logger.info(`Delete todo for user: ${userId}`)

  await todoAccess.deleteTodo(todoId, userId)
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
