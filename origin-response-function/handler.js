const path = require('path')
const AWS = require('aws-sdk')

const S3 = new AWS.S3({
  signatureVersion: 'v4',
})

const Sharp = require('sharp')
const BUCKET = 'bucket_placeholder'
const QUALITY = 100

exports.handler = async (event, context, callback) => {
  const { request, response } = event.Records[0].cf
  const { uri } = request
  const headers = response.headers

  if (path.extname(uri) === '.webp') {
    console.log(response)
    console.log(request)
    if (parseInt(response.status) === 404) {
      const format = request.headers['original-resource-type'] && request.headers['original-resource-type'][0]
        ? request.headers['original-resource-type'][0].value.replace('image/', '')
        : null

      const key = uri.substring(1)
      const s3key = key.replace('.webp', `.${format}`)
      console.log("Printing key:", key)
      console.log("Printing S3key", s3key)
      try {
        const bucketResource = await S3.getObject({ Bucket: BUCKET, Key: decodeURI(s3key) }).promise()
        const fileSizeInKb = bucketResource.ContentLength / 1024;  // Convert to KB

        let webpOptions = {};

        if (['jpg', 'jpeg'].includes(format)) {
          webpOptions.quality = +QUALITY;
          if (fileSizeInKb < 250) {
            webpOptions.lossless = true;
          }
        } else if (format === 'png') {
          webpOptions = { quality: +QUALITY, lossless: true };
        }
      
        console.log("webpOptions:", webpOptions)

        const sharpImageBuffer = await Sharp(bucketResource.Body)
          .webp(webpOptions)
          .toBuffer();

        console.log("Got the S3 image and converted. Trying to put it into S3")

        await S3.putObject({
          Body: sharpImageBuffer,
          Bucket: BUCKET,
          ContentType: 'image/webp',
          CacheControl: 'max-age=31536000',
          Key: decodeURI(key),
          StorageClass: 'STANDARD'
        }).promise()

        response.status = 200
        response.body = sharpImageBuffer.toString('base64')
        response.bodyEncoding = 'base64'
        response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/webp' }]
      } catch (error) {
        console.log("Printing the error:")
        console.error(error)
      }
    } else {
      console.log("Its not 404, So returning webp")
      headers['content-type'] = [{
        'value': 'image/webp',
        'key': 'Content-Type'
      }]
    }
  }
  callback(null, response)
 }
