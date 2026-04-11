import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth.js';

const QUERY = 'from:(therundown.ai OR bensbites.com OR theunwindai.com OR news.smol.ai) newer_than:1d';

function decodeBody(part) {
  if (!part) return '';

  // Recurse into multipart
  if (part.parts) {
    return part.parts.map(decodeBody).join('\n');
  }

  const data = part.body?.data;
  if (!data) return '';

  // Gmail uses URL-safe base64
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

export async function fetchEmails() {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: QUERY,
    maxResults: 20,
  });

  const messages = listRes.data.messages ?? [];

  if (messages.length === 0) return '';

  const bodies = await Promise.all(
    messages.map(async ({ id }) => {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      });

      const subject = msg.data.payload.headers?.find(h => h.name === 'Subject')?.value ?? '';
      const body = decodeBody(msg.data.payload);
      return `--- EMAIL: ${subject} ---\n${body}`;
    })
  );

  return bodies.join('\n\n');
}
