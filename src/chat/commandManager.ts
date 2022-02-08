import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { readdirSync } from 'fs';
import * as logger from '../utils/logger';

const commands: Map<string, (channelname: string, username: string, message: string, msg: TwitchPrivateMessage) => void> = new Map<string, (channelname: string, username: string, message: string, msg: TwitchPrivateMessage) => void>();

export function registerCommands() {
  const files = readdirSync(`${__dirname}/commands/`).filter((file) => file.endsWith('.js'));
  
  for (const file of files) {
    logger.log(logger.LogMessageType.INFO, logger.LogService.TWITCH, 'Found command handler ' + file + '...');
    const cmd = require(`./commands/${file}`);
    commands.set(cmd.name, cmd.handle);
  }
}

export function handleCommands(channelname: string, username: string, message: string, msg: TwitchPrivateMessage, cmd: string) {
  if (commands.has(cmd)) {
    const handler = commands.get(cmd);
    if (handler) {
      handler(channelname, username, message, msg);
    }
  }
}