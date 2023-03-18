import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser } from '../../helpers/todos'
import {
  getUserId,
  parseLimitParameter,
  parseNextKeyParameter,
  parseOrderByParameter
} from '../utils'
import { GetTodosResponse } from '../../models/GetTodoResponse'

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId: string = getUserId(event)
    let nextKey
    let limit
    let orderBy

    try {
      // Parse query parameters
      nextKey = parseNextKeyParameter(event)
      limit = parseLimitParameter(event) || 10
      orderBy = parseOrderByParameter(event) || ''
    } catch (e) {
      console.log('Failed to parse query parameters: ', e.message)
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid parameters'
        })
      }
    }

    const response: GetTodosResponse = await getTodosForUser(
      userId,
      nextKey,
      limit,
      orderBy
    )

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        items: response.items,
        nextKey: response.nextKey
      })
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
