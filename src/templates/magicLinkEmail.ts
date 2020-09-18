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

const pStyle = 'margin-right:auto;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;color:#000000;font-size:18px;line-height:1.45;';
const hdrStyle = 'margin-right:auto;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;color:#000000;font-size:26px;font-weight:bold;';
const btnStyle = 'display:table-cell;text-decoration:none;padding:15px 30px;font-size:15px;text-align:center;font-weight:bold;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;width:100%;color:#ffffff;border:solid;background-color:#370842;border-radius:0px;';

export default (name: string, magicLink: string) => `
<div style="${hdrStyle}"><strong>Привет</strong><strong style="color:rgb(0,255,194)">.</strong></div>

<p style='${pStyle}'>Ты просил нас отправить тебе Волшебную ссылку для входа в Место. Твоё желание исполнено.</p>

<a href="${magicLink}" style="${btnStyle}">Войти в место</a>

<p style='${pStyle}'>Ссылка текстом: <a href="${magicLink}">${magicLink}</a></p>

<p style='${pStyle}'>Примечание: твоя ссылка будет работать 15 минут и может быть использована всего один раз.</p>

<p style='${pStyle}'>Если ты не запрашивал ссылку - просто проигнорируй письмо.</p>

<p style='${pStyle}'>С уважением,<br>
команда Место.</p>
`;
