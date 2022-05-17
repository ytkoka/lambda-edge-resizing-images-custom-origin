# Resizing Images with Lambda@Edge using S3

You can resize the images and convert the image format by query parameters. This Lambda@Edge sample code using S3 as the original image source.

Original: https://github.com/aws-samples/lambda-edge-resizing-images-custom-origin (Custom Origin)

## Prerequisites
* [AWS Cloud Development Kit (AWS CDK)](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html): You will deploy the project using AWS CDK.

## Deployment

Install dependencies
```
npm install
```
Install [Sharp](https://sharp.pixelplumbing.com/) for Lambda@Edge
```
cd resources
npm install --arch=x64 --platform=linux sharp
```
Go back to the root and run bootstrap the AWS CDK
```
npm run cdk -- bootstrap --region us-east-1
```
Deploy the stack
```
cdk deploy
```
You can find the new CloudFront distribution once the deployment is successful. Please check the distribution settings and access the URL with the parameters below.

## Query Parameters
Resize and convert JPEG (*.jpg) images based on the query string parameters:
* width  : pixels (auto-scale the height to match the width)
* format : jpg or webp

Example-1 : Change width to 240 pixel while format keeps jpeg format (need format parameter even though no format change)

`https://dxxxxx.cloudfront.net/sample.jpg?width=240&format=jpg`

Example-2 : Change width to 360 pixel and convert to webp format

`https://dxxxxx.cloudfront.net/sample.jpg?width=360&format=webp`

## Cleanup
You will need to [manually delete the Lamnbda@Edge function](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-delete-replicas.html) (CdkImageConverterStack-) then remove the stack with:
```
cdk destroy
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.