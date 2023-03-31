import { S3Handler, S3Event } from 'aws-lambda'
import 'source-map-support/register'
import { AttachmentUtils } from '../../helpers/attachmentUtils'
import { TodosAccess } from '../../dataLayer/todosAcess'
import { createLogger } from '../../utils/logger'
const logger = createLogger('resizeImage')
const attachmentUtils = new AttachmentUtils()
const todoAccess = new TodosAccess()

export const handler: S3Handler = async (event: S3Event) => {
  logger.info('Processing S3 event')
  for (const record of event.Records) {
    // Only resize image with name not start with "resize_"
    var key = record.s3.object.key
    if (!key.startsWith('resize_')) {
      var key = key.replace('.png', '')
      logger.info('Resize image - S3 event')
      logger.info(key)
      await attachmentUtils.resizeImage(key)

      // Save db
      const todo = await todoAccess.getTodoByImageId(key)
      logger.info(todo)

      await todoAccess.updateImageSourceToDo(
        todo.todoId,
        todo.userId,
        'resize_' + key
      )

      // Delete old image
      logger.info('Delete old image')
      await attachmentUtils.deleteImageFile(key)
      logger.info('Done')
    }
  }
}
