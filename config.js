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

const lambdaConfig = {
  database: {
    client: 'postgresql',
    connection: process.env.DATABASE,
  },
  magicLink: {
    jwtExpiresIn: process.env.MAGIC_LINK_JWT_EXPIRES_IN || '15m',
    url: process.env.MAGIC_LINK_URL,
  },
  refreshToken: {
    jwtExpiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '60 days',

    // potential way to generate a secret:
    // require('crypto').randomBytes(256, (,buf) => console.log(buf.toString('base64)));
    jwtSecret: Buffer.from(process.env.REFRESH_JWT_SECRET || '', 'base64')
  },
  accessToken: {
    jwtExpiresIn: process.env.ACCESS_JWT_EXPIRES_IN || '15m',

    // potential way to generate a secret:
    // require('crypto').randomBytes(256, (,buf) => console.log(buf.toString('base64)));
    jwtSecret: Buffer.from(process.env.ACCESS_JWT_SECRET || '', 'base64')
  },
  emailService: {
    debug: false,
    senderEmailAddress: process.env.SENDER_EMAIL_ADDRESS,
    smtpHost: process.env.SMTP_HOST,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  imageUpload: {
    maxSize: process.env.IMAGE_UPLOAD_MAX_SIZE || 50 * 1024,
    bucketName: process.env.IMAGE_UPLOAD_S3_BUCKET_NAME || '',
    skipUploadToS3: false,
    url: process.env.IMAGE_URL
  },
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  peerboardAuthToken: process.env.PEERBOARD_AUTH_TOKEN,
  corsOrigin: process.env.CORS_ORIGIN || 'https://app.mesto.co/',
  adminUserId: process.env.ADMIN_USER_ID,
  enableMethodsForTest: false,
  openlandToken: process.env.OPENLAND_TOKEN,
  // node -e "console.log(crypto.randomBytes(32).toString('hex'))"
  openlandCodeSecret: process.env.OPENLAND_CODE_SECRET
};

const developmentConfig = {
  ...lambdaConfig,

  magicLink: {
    ...lambdaConfig.magicLink,

    url: process.env.MAGIC_LINK_URL || 'http://localhost:2000/auth/magic-link/?'
  },

  database: {
    ...lambdaConfig.database,

    connection: process.env.DATABASE || 'postgres://postgres:testtesttest@postgres:5432/postgres',
  },

  refreshToken: {
    ...lambdaConfig.refreshToken,

    jwtSecret: 'refresh-secret'
  },

  accessToken: {
    ...lambdaConfig.accessToken,

    jwtSecret: 'access-secret'
  },

  emailService: {
    ...lambdaConfig.emailService,

    saveFilePath: 'app/magic-link.txt',
    debug: true
  },

  imageUpload: {
    ...lambdaConfig.imageUpload,

    skipUploadToS3: true
  },

  peerboardAuthToken: process.env.PEERBOARD_AUTH_TOKEN || 'peerboard-auth-token',
  corsOrigin: '*',
  adminUserId: '00000000-1111-2222-3333-000000000009',
  enableMethodsForTest: true,
  openlandToken: process.env.OPENLAND_TOKEN || 'YYeXUMHV_40G3jKvYV2Bz1wIfxpWUB9hfWbXmVkEormuC3jTT2ZqbUWOMw4LGtKxVhqmzA-7ds_Bp3MSXEeW5A',
  openlandCodeSecret: process.env.OPENLAND_CODE_SECRET || '4003fe4c92ed4ac97363c7528e30bbb798c59fefbcfb35ffe6ef937c45d86d86'
};

const config = {
  development: developmentConfig,
  test: developmentConfig,
  lambda: lambdaConfig
};

module.exports = config[process.env.NODE_ENV || 'development'];
