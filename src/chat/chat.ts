import { ChatClient } from '@twurple/chat';
import Environment from '../utils/environment';
import { getBotUserAccessToken } from '../auth/auth';
import * as logger from '../utils/logger';
import { readdirSync } from 'fs';

let chatClient: ChatClient;

function registerListeners() {
  const files = readdirSync(`${__dirname}/listeners/`).filter((file) => file.endsWith('.js'));

  for (const file of files) {
    logger.log(logger.LogMessageType.INFO, logger.LogService.TWITCH, 'Found chat listener ' + file + '...');
    require(`./listeners/${file}`);
  }
}

export async function registerChatClient() {
  chatClient = new ChatClient({
    authProvider: await getBotUserAccessToken(),
    botLevel: 'none',
    channels: Environment.Twitch.CHANNELS,
    requestMembershipEvents: false,
    isAlwaysMod: true,
  });

  registerListeners();
    
  await chatClient.connect();
  logger.log(logger.LogMessageType.INFO, logger.LogService.TWITCH, 'Twitch chat client connected to channels: ' + Environment.Twitch.CHANNELS);
}

export function getChatClient(): ChatClient {
  return chatClient;
}