'use strict';

const AWS = require('aws-sdk');
const https = require('https');
const Sharp = require('sharp');
const keepAliveAgent = new https.Agent({ keepAlive: true });
const S3 = new AWS.S3({httpOptions: {agent: keepAliveAgent}});

exports.handler = (event, context, callback) => {

  const request = event.Records[0].cf.request;
  // Read the S3 origin name
  const s3DomainName = request.origin.s3.domainName;
  const BUCKET = s3DomainName.substring(0, s3DomainName.lastIndexOf(".s3"));

  console.log("Bucket:%s", BUCKET);
  console.log("Image:%s", request.uri);



  var resizingOptions = {};
  const params = new URLSearchParams(request.querystring);
  if (!params.has('width') || !params.has('format')) {
    // if there is no width parameter, just pass the request
    console.log("no params");
    callback(null, request);
    return;
  }
  resizingOptions.width = parseInt(params.get('width'));

  console.log(resizingOptions.width);

  // get the source image from S3
  S3.getObject({ Bucket: BUCKET, Key: request.uri.substring(1) }).promise()

    .then(data => Sharp(data.Body)
      .resize(resizingOptions)
      .toFormat(params.get('format'))
      .toBuffer()
    )
    .then(buffer => {
      let base64String = buffer.toString('base64');
      if (base64String.length > 1048576) {
        throw 'Resized filesize payload is greater than 1 MB. Returning original image'
      }
      console.log("Length of response :%s", base64String.length);
      // generate a binary response with resized image
      let response = {
        status: '200',
        statusDescription: 'OK',
        headers: {
          'cache-control': [{
            key: 'Cache-Control',
            value: 'max-age=86400'
          }],
          'content-type': [{
            key: 'Content-Type',
            value: 'image/' + params.get('format')
          }]
        },
        bodyEncoding: 'base64',
        body: base64String
      };

      callback(null, response);
    })
    .catch(err => {
      console.log("Exception while reading source image :%j", err);
      callback(null, request);
    });
};
