import { AccessToken, ClientCredentialsAuthProvider, RefreshingAuthProvider } from '@twurple/auth';
import * as logger from '../utils/logger';
import { execute } from '../utils/database';
import Environment from '../utils/environment';

const clientCredentialsAuthProvider = new ClientCredentialsAuthProvider(
  Environment.Twitch.Helix.CLIENT_ID,
  Environment.Twitch.Helix.CLIENT_SECRET,
);

async function getTokenFromDB(userId: string): Promise<AccessToken | undefined> {
  const result = await execute('SELECT * FROM tokens WHERE userId = ?', [userId]);
  if (result.length == 1) {
    return {
      accessToken: result[0].accessToken,
      refreshToken: result[0].refreshToken,
      expiresIn: result[0].expiresIn,
      obtainmentTimestamp: Date.parse(result[0].obtainmentTimestamp),
      scope: result[0].scope,
    };
  } else {
    logger.log(logger.LogMessageType.ERROR, logger.LogService.TWITCH, 'There are ' + result.length + ' user access tokens for the user with the id ' + userId + '.');
    return undefined;
  }
}

async function updateTokenInsideDB(userId: string, token: AccessToken) {
  const scopes: string[] = [];
  token.scope.forEach(function (part, index) {
    scopes[index] = '"' + part + '"';
  });
  await execute('UPDATE tokens SET accessToken = ?, refreshToken = ?, expiresIn = ?, obtainmentTimestamp = ?, scope = ? WHERE userId = ?', [token.accessToken, token.refreshToken, token.expiresIn, new Date(token.obtainmentTimestamp), '[' + scopes.toString() + ']', userId]);
}

export function getAppAccessToken(): ClientCredentialsAuthProvider {
  return clientCredentialsAuthProvider;
}

export async function getUserAccessToken(userId: string): Promise<RefreshingAuthProvider> {
  const token = await getTokenFromDB(userId);
  if (!token) {
    throw new Error('Token for user with the id ' + userId + ' not found inside the db. Please insert one!');
  }
  return new RefreshingAuthProvider({
    clientId: Environment.Twitch.Helix.CLIENT_ID,
    clientSecret: Environment.Twitch.Helix.CLIENT_SECRET,
    onRefresh: function (newTokenData: AccessToken) {
      updateTokenInsideDB(userId, newTokenData);
      logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Updated the access token from the user with the id ' + userId + '.');
    },
  }, token);
}

export async function getBotUserAccessToken(): Promise<RefreshingAuthProvider> {
  return getUserAccessToken(Environment.Twitch.Helix.USER_ID);
}