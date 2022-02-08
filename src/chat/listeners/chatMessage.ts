/* eslint-disable @typescript-eslint/no-unused-vars */

import { getChatClient } from '../chat';
import * as logger from '../../utils/logger';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { handleCommands } from '../commandManager';
import { addMessage } from '../../managers/messageManager';
import { checkEmotes } from '../../managers/emoteManager';
import Cache from '../../utils/cache';
import Environment from '../../utils/environment';

getChatClient().onMessage((channelname: string, username: string, message: string, msg: TwitchPrivateMessage) => {
  channelname = channelname.substring(1, channelname.length);
  handleCommands(channelname, username, message, msg, message.split(' ')[0]);
  if (msg.channelId != null) {
    Cache.TwitchIds.set(username, msg.userInfo.userId, Environment.Cache.TWITCH_ID);
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Updated user id from user ' + username + ' to ' + msg.userInfo.userId + ' inside the cache while parsing a message.');
    addMessage(msg.userInfo.userId, msg.channelId, message);
    checkEmotes(msg.userInfo.userId, msg.channelId, message, msg);
  }
  logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'The user ' + username + ' send a message inside the chat from ' + channelname + ': ' + message);
});