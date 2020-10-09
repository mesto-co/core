/**
 * Copyright (c) Mesto.co
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import express from 'express';
import { S3 } from 'aws-sdk';
import Busboy from 'busboy';
const config = require('../../config.js');

const s3 = new S3();

async function uploadFileToS3(content: Buffer, mimeType: string) {
  // for the sake of simplicity we support only png & jpeg.
  const ext = mimeType.indexOf('png') ? '.png' : '.jpeg';
  // prefix folder is used to avoid collisions.
  const path = Math.floor(Math.random() * 255).toString(16) + '/' + Date.now() + ext;
  // Setting up S3 upload parameters
  const params = {
    Bucket: config.imageUpload.bucketName,
    Key: path, // File name you want to save as in S3
    Body: content,
    ACL: 'public-read'
  };

  if (config.imageUpload.skipUploadToS3)
    console.log(`s3.upload is disabled. Bucket: ${config.imageUpload.bucketName}, path: ${path}`);
  else
    await s3.upload(params).promise();

  return path;
}

const uploadRouter = express.Router();
uploadRouter.route('/')
    .post(async (request, response) => {
      const busboy = new Busboy({
        headers: request.headers,
        limits: {
          files: 1,
          fileSize: config.imageUpload.maxSize
        }
      });

      busboy.on('file', function(fieldName: string, file: any, filename: string, encoding: string, mimetype: string) {
        const temp: any = [];
        let errorMessage: string;
        let errorCode: number = 0;

        if (mimetype !== 'image/png' && mimetype !== 'image/jpeg'){
          errorMessage = 'Invalid image MIME type, supported types: jpeg/png.';
          errorCode = 1;
          // Ignore the upload, move on to next one
          file.resume();
        }

        file.on('data', (data: any) => {
          temp.push(data);
        });

        file.on('limit', () => {
          errorMessage = `Max image size: ${config.imageUpload.maxSize}`;
          errorCode = 2;
        });

        file.on('end', async () => {
          try {
            if (errorCode > 0)
              return response.status(500).json({errorMessage, errorCode}).end();

            const content = Buffer.concat(temp);
            const path = await uploadFileToS3(content, mimetype);

            const url = config.imageUpload.url + path;
            return response.status(200).json({path: path, url: url }).end();
          } catch (e) {
            console.error('uploadImage error', e);
            return response.status(500).json({}).end();
          }
        });
      });

      return request.pipe(busboy);
    });

export { uploadRouter as UploadImageController };
