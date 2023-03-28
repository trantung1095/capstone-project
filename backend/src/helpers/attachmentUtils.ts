import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import Jimp from 'jimp/es'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic
export class AttachmentUtils {
  constructor(private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' })) {}

  getSignedUrl(todoId: string): string {
    const signedUrl = this.s3.getSignedUrl('putObject', {
      Bucket: process.env.ATTACHMENT_S3_BUCKET,
      Key: todoId,
      Expires: Number(process.env.SIGNED_URL_EXPIRATION)
    })

    return signedUrl as string
  }

  async deleteImageFile(imageId: string) {
    await this.s3
      .deleteObject({
        Bucket: process.env.ATTACHMENT_S3_BUCKET,
        Key: imageId + '.png'
      })
      .promise()
  }

  async resizeImage(imageKey: string) {
    const response = await this.s3
      .getObject({
        Bucket: process.env.ATTACHMENT_S3_BUCKET,
        Key: imageKey + '.png'
      })
      .promise()

    const body = response.Body
    const image = await Jimp.read(body)
    image.resize(150, Jimp.AUTO)
    const convertedBuffer = await image.getBufferAsync(Jimp.AUTO)

    await this.s3
      .putObject({
        Bucket: process.env.ATTACHMENT_S3_BUCKET,
        Key: 'resize_' + imageKey + '.png',
        Body: convertedBuffer
      })
      .promise()
  }
}
