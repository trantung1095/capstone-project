export function encodeNextKey(lastEvaluatedKey: any): string {
  if (!lastEvaluatedKey) {
    return null
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}
