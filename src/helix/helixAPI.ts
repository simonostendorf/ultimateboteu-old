import { ApiClient } from '@twurple/api';
import Cache from '../utils/cache';
import { getAppAccessToken } from '../auth/auth';
import * as logger from '../utils/logger';
import Environment from '../utils/environment';

const apiClient = new ApiClient({ 
  authProvider: getAppAccessToken(),
});

export default function getAPIClient(): ApiClient {
  return apiClient;
}

export async function getUserIdByName(name: string): Promise<string | undefined> {
  let cachedID = await Cache.TwitchIds.get(name);
  if (!cachedID) {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'User id from user ' + name + ' not found inside the cache. Getting it from the twitch api...');
    const helixUser = await apiClient.users.getUserByName(name);
    if (!helixUser) {
      throw new Error('User with name ' + name + ' not found inside of helix or cache.');
    }
    cachedID = helixUser.id;
    Cache.TwitchIds.set(name, cachedID, Environment.Cache.TWITCH_ID);
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Got user id ' + cachedID + ' from user ' + name + ' from the twitch api and saved it to the cache.');
  } else {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Read user id ' + cachedID + ' from user ' + name + ' from the cache.');
  }
  return cachedID;
}