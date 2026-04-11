import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = './token.json';
const CREDENTIALS_PATH = './credentials.json';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

export async function getAuthenticatedClient() {
  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id } = credentials.installed ?? credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  return authorizeOOB(oAuth2Client);
}

async function authorizeOOB(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\nOpen this URL in your browser to authenticate with Google:\n');
  console.log(authUrl);
  console.log('\nAfter approving, Google will show you a code. Paste it below.\n');

  const code = await prompt('Enter the authorization code: ');

  const { tokens } = await oAuth2Client.getToken(code.trim());
  oAuth2Client.setCredentials(tokens);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('Token saved to token.json\n');

  return oAuth2Client;
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
