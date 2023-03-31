import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { TodoPagination } from '../models/TodoPagination'
import { encodeNextKey } from '../lambda/utils'
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly tableName = process.env.TODOS_TABLE
  ) {}

  async getTodos(
    userId: string,
    limit: number,
    key: any
  ): Promise<TodoPagination> {
    logger.info('Getting all todos')

    const query = await this.docClient
      .query({
        TableName: process.env.TODOS_TABLE,
        Limit: limit,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ExclusiveStartKey: key
      })
      .promise()

    logger.info('Result query')
    logger.info(query)

    const result: TodoPagination = {
      items: query.Items as TodoItem[],
      nextKey: encodeNextKey(query.LastEvaluatedKey)
    }

    return result
  }

  async getTodoByImageId(imageId: string): Promise<TodoItem> {
    logger.info('Getting to do by image id')

    const query = await this.docClient
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

  async getTodo(todoId: string, userId: string): Promise<TodoItem> {
    logger.info('Getting to do')

    const query = await this.docClient
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

  async createTodo(data: TodoItem): Promise<TodoItem> {
    logger.info('Create todo')

    await this.docClient
      .put({
        TableName: this.tableName,
        Item: data
      })
      .promise()

    return data
  }

  async updateTodo(
    todoId: string,
    userId: string,
    data: TodoUpdate
  ): Promise<TodoUpdate> {
    logger.info('Update todo')

    await this.docClient
      .update({
        TableName: this.tableName,
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

  // Update attachment Url
  async updateImageSourceToDo(todoId: string, userId: string, imageId: string) {
    var attachmentUrl = `https://${process.env.ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/${imageId}.png`

    if (imageId === '' || imageId === null) {
      attachmentUrl = null
      imageId = null
    }

    await this.docClient
      .update({
        TableName: this.tableName,
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

  async deleteTodo(todoId: string, userId: string) {
    logger.info('Delete todo')

    await this.docClient
      .delete({
        TableName: this.tableName,
        Key: {
          todoId: todoId,
          userId: userId
        }
      })
      .promise()
  }
}
