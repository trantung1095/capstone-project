import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import {
  createAttachmentPresignedUrl,
  updateTodo
} from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)

    // Update a TODO item with the provided id using values in the "updatedTodo" object
    await updateTodo(todoId, userId, updatedTodo)

    // If user submit image, return presigned url
    var uploadUrl: string = ''
    if (updatedTodo.isUpdateImage === true) {
      uploadUrl = await createAttachmentPresignedUrl(todoId, userId)
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        item: updatedTodo,
        uploadUrl: uploadUrl
      })
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
