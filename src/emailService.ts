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

const config = require('../config.js');

import { promises as fs } from 'fs';
import magicLinkTemplate from './templates/magicLinkEmail';
import inviteEmailTemplate from './templates/inviteEmail';
import telegramLinkTemplate from './templates/telegramLinkTemplate';
import nodemailer from 'nodemailer';
import Mail = require('nodemailer/lib/mailer');

class EmailService {
  _transport: Mail | undefined;

  async sendMagicLinkEmail(recipient: string, magicLink: string) {
    const content = magicLinkTemplate(magicLink);
    const subject = 'Линк для входа в mesto.';

    if (config.emailService.debug && config.emailService.saveFilePath)
      await fs.writeFile(config.emailService.saveFilePath, magicLink, 'utf8');

    await this.sendEmail(recipient, subject, content);
  }

  async sendInviteEmail(recipient: string, magicLink: string) {
    const content = inviteEmailTemplate(magicLink);
    const subject = 'Добро пожаловать в Место';
    return this.sendEmail(recipient, subject, content);
  }

  async sendTelegramLinkEmail(recipient: string, magicLink: string) {
    const content = telegramLinkTemplate(magicLink);
    const subject = 'Ссылка для входа в бот Места';
    return this.sendEmail(recipient, subject, content);
  }

  sendEmail(recipient: string, subject: string, content: string) {
    if (config.emailService.debug) {
      console.log(`Email sent: ${recipient}, subject: ${subject}, body:\n${content}`);
      return;
    }

    return new Promise((resolve, reject) => this.transport().sendMail({
      from: config.emailService.senderEmailAddress,
      to: recipient,
      subject: subject,
      html: content
    }, error => {
      if (error)
        reject(error);
      else
        resolve();
    }));
  }

  private transport() {
    if (!this._transport) {
      const {smtpHost, smtpUser, smtpPass} = config.emailService;
      this._transport = nodemailer.createTransport({
        host: smtpHost,
        port: 25,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
    return this._transport;
  }
}

const emailService = new EmailService();
export { emailService };
