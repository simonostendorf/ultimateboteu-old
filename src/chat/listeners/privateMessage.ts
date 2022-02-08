/* eslint-disable @typescript-eslint/no-unused-vars */

import { getChatClient } from '../chat';
import * as logger from '../../utils/logger';
import { Whisper } from '@twurple/chat';

getChatClient().onWhisper((username: string, message: string, msg: Whisper) => {
  logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'The user ' + username + ' send a private message: ' + message);
});