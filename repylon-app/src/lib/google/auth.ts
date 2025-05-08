import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : 'http://localhost:3000/api/auth/callback/google';

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export const getGoogleAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
};

export const getGoogleTokens = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error getting Google tokens:', error);
    throw new Error('Failed to retrieve Google tokens');
  }
};

export const getGoogleUserProfile = async () => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const res = await gmail.users.getProfile({ userId: 'me' });
    return res.data;
  } catch (error) {
    console.error('Error fetching Google user profile:', error);
    // It's possible the tokens are expired or revoked, try to refresh if a refresh token exists
    if (oauth2Client.credentials.refresh_token) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        // Retry fetching profile
        const gmailRetry = google.gmail({ version: 'v1', auth: oauth2Client });
        const resRetry = await gmailRetry.users.getProfile({ userId: 'me' });
        return resRetry.data;
      } catch (refreshError) {
        console.error('Error refreshing Google access token:', refreshError);
        throw new Error('Failed to refresh Google access token and fetch profile');
      }
    }
    throw new Error('Failed to fetch Google user profile');
  }
};

