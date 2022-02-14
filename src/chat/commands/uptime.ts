import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { getUptime, millisToString } from '../../utils/time';
import { getChatClient } from '../chat';

export const name: string = '!botuptime';

// !botuptime

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handle(channelname: string, username: string, message: string, msg: TwitchPrivateMessage) {
  if (!msg.userInfo.isMod && !msg.userInfo.isBroadcaster) {
    return;
  }
  
  if (msg.channelId != null) {
    getChatClient().say(channelname, 'Der Bot ist seit ' + millisToString(getUptime(), false) + ' online.', { replyTo: msg });
  }
}