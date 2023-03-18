import { APIGatewayProxyEvent } from 'aws-lambda'
import { parseUserId } from '../auth/utils'

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

/**
 * Get a query parameter or return "undefined"
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * @param {string} name a name of a query parameter to return
 *
 * @returns {string} a value of a query parameter value or "undefined" if a parameter is not defined
 */
export function getQueryParameter(
  event: APIGatewayProxyEvent,
  name: string
): string {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}

/**
 * Get value of the limit parameter.
 */
export function parseLimitParameter(event: APIGatewayProxyEvent): number {
  const limitStr = getQueryParameter(event, 'limit')
  if (!limitStr) {
    return undefined
  }

  const limit = parseInt(limitStr, 10)
  if (limit <= 0) {
    throw new Error('Limit should be positive')
  }

  return limit
}

/**
 * Get value of the order by parameter.
 *
 * @param event HTTP event passed to a Lambda function
 *
 * @returns parsed "orderBy" parameter
 */
export function parseOrderByParameter(event: APIGatewayProxyEvent): string {
  const orderByStr = getQueryParameter(event, 'orderBy')
  if (!orderByStr) {
    return undefined
  }

  return orderByStr
}

/**
 * Get value of the limit parameter.
 *
 * @param event HTTP event passed to a Lambda function
 *
 * @returns parsed "nextKey" parameter
 */
export function parseNextKeyParameter(event: APIGatewayProxyEvent): any {
  const nextKeyStr = getQueryParameter(event, 'nextKey')
  if (!nextKeyStr) {
    return undefined
  }

  const uriDecoded = decodeURIComponent(nextKeyStr)
  return JSON.parse(uriDecoded)
}
