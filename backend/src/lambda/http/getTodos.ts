import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId, parseLimitParameter, parseNextKeyParameter } from '../utils'
import { createLogger } from '../../utils/logger'
const logger = createLogger('getTodos')

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Pagination
    const limit = parseLimitParameter(event) || 9
    const key = parseNextKeyParameter(event)

    // Get todos
    logger.info('get Todos For User')
    const userId = getUserId(event)
    const result = await getTodosForUser(userId, limit, key)

    // Check if this is last page, set nextKey empty
    if (result.nextKey !== null) {
      const nextKeyDecode = decodeURIComponent(result.nextKey)
      const nextKey = JSON.parse(nextKeyDecode)

      logger.info('Check next page')
      const checkLastPage = await getTodosForUser(userId, 1, nextKey)
      if (checkLastPage.items === null || checkLastPage.items.length === 0) {
        logger.info('This is last page')
        result.nextKey = null
      }
    }

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        items: result.items,
        nextKey: result.nextKey
      })
    }
    return response
  }
)

handler.use(
  cors({
    credentials: true
  })
)
