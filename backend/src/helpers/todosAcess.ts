import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { encodeNextKey } from './utils'
import { GetTodosResponse } from '../models/GetTodoResponse'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor(private readonly todosTable = process.env.TODOS_TABLE) {}
  async getTodos(
    userId: string,
    nextKey: any,
    limit: number,
    orderBy: string
  ): Promise<GetTodosResponse> {
    logger.debug('Getting all todos')

    let indexName = process.env.TODOS_CREATED_AT_INDEX
    if (!!orderBy && orderBy === 'dueDate') {
      indexName = process.env.TODOS_DUE_DATE_INDEX
    }

    const params = {
      TableName: this.todosTable,
      IndexName: indexName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: limit,
      ScanIndexForward: false,
      ExclusiveStartKey: nextKey
    }

    const result = await docClient.query(params).promise()

    return {
      items: result.Items as TodoItem[],
      nextKey: encodeNextKey(result.LastEvaluatedKey)
    } as GetTodosResponse
  }

  async getTodo(todoId: string, userId: string): Promise<TodoItem> {
    logger.info('Getting to do')

    const query = await docClient
      .query({
        TableName: process.env.TODOS_TABLE,
        KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':todoId': todoId
        }
      })
      .promise()

    const items = query.Items
    return items[0] as TodoItem
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.debug('Create new todo')

    await docClient
      .put({
        TableName: this.todosTable,
        Item: todo
      })
      .promise()

    return todo as TodoItem
  }

  async getTodoByImageId(imageId: string): Promise<TodoItem> {
    logger.info('Getting to do by image id')

    const query = await docClient
      .scan({
        TableName: process.env.TODOS_TABLE,
        FilterExpression: 'imageId = :imageId',
        ExpressionAttributeValues: {
          ':imageId': imageId
        }
      })
      .promise()

    const items = query.Items
    return items[0] as TodoItem
  }

  async updateImageSourceToDo(todoId: string, userId: string, imageId: string) {
    var attachmentUrl = `https://${process.env.ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/${imageId}.png`

    if (imageId === '' || imageId === null) {
      attachmentUrl = null
      imageId = null
    }

    await docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId: userId,
          todoId: todoId
        },
        UpdateExpression:
          'set attachmentUrl = :attachmentUrl, imageId = :imageId',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl,
          ':imageId': imageId
        }
      })
      .promise()
  }

  async updateTodo(
    todoId: string,
    userId: string,
    data: TodoUpdate
  ): Promise<TodoUpdate> {
    logger.info('Update todo')

    await docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId: todoId,
          userId: userId
        },
        UpdateExpression: 'set #n = :n, dueDate = :dueDate, done = :done',
        ExpressionAttributeValues: {
          ':n': data.name,
          ':dueDate': data.dueDate,
          ':done': data.done
        },
        ExpressionAttributeNames: { '#n': 'name' }
      })
      .promise()

    return data
  }

  async deleteTodo(todoId: string, userId: string): Promise<any> {
    console.log('Deleting todo')

    const params = {
      TableName: this.todosTable,
      Key: {
        todoId: todoId,
        userId: userId
      }
    }

    return await docClient.delete(params).promise()
  }
}
