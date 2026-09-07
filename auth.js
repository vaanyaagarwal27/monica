import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import http from 'http';
import { URL } from 'url';
import open from 'open';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = './token.json';
const CREDENTIALS_PATH = './credentials.json';
const PORT = 5544;
const REDIRECT_URI = `http://127.0.0.1:${PORT}`;

export async function getAuthenticatedClient() {
  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id } = credentials.installed ?? credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  return authorizeLoopback(oAuth2Client);
}

function authorizeLoopback(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
    });

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, REDIRECT_URI);
        const code = url.searchParams.get('code');
        if (!code) {
          res.end('No code found. You can close this tab.');
          return;
        }
        res.end('Monica is authorized. Close this tab and return to the terminal.');
        server.close();

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log('\nToken saved to token.json\n');
        resolve(oAuth2Client);
      } catch (err) {
        reject(err);
      }
    });

    server.listen(PORT, () => {
      console.log('\nOpening your browser to authorize Monica...');
      console.log('If it doesn\'t open, paste this URL manually:\n');
      console.log(authUrl + '\n');
      open(authUrl).catch(() => {});
    });
  });
}