import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import Cache from '../../utils/cache';
import Environment from '../../utils/environment';
import { getChatClient } from '../chat';
import { getMessageCountCurrentStream, getMessageCountTotal } from '../../managers/messageManager';
import { getUserIdByName } from '../../helix/helixAPI';

export const name: string = '!messagecount';

// !messagecount <user>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handle(channelname: string, username: string, message: string, msg: TwitchPrivateMessage) {
  if (!msg.userInfo.isMod && !msg.userInfo.isBroadcaster) {
    return;
  }
  
  if (msg.channelId != null) {
    if (!await Cache.MessageCountCommandCooldown.get(msg.userInfo.userId)) {
      if (message.split(' ').length == 2) {
        const otherUsername = message.split(' ')[1].replace('@', '');
        const id = await getUserIdByName(otherUsername);
        if (!id) {
          getChatClient().say(channelname, 'Der Nutzer ' + otherUsername + ' konnte nicht gefunden werden.', { replyTo: msg });
          return;
        }
        const count = await getMessageCountTotal(id, msg.channelId);
        const countStream = await getMessageCountCurrentStream(id, msg.channelId);
        if (count > 0) {
          if (countStream != null) {
            getChatClient().say(channelname, 'Der Nutzer ' + otherUsername + ' hat während dieses Streams ' + countStream + ' und gesamt ' + count + ' Nachrichten geschrieben.', { replyTo: msg });
          } else {
            getChatClient().say(channelname, 'Der Nutzer ' + otherUsername + ' hat ' + count + ' Nachrichten geschrieben.', { replyTo: msg });
          }
        } else {
          getChatClient().say(channelname, 'Der Nutzer ' + otherUsername + ' hat noch keine Nachrichten geschrieben.', { replyTo: msg });
        }
      } else {
        const count = await getMessageCountTotal(msg.userInfo.userId, msg.channelId);
        const countStream = await getMessageCountCurrentStream(msg.userInfo.userId, msg.channelId);
        if (count > 0) {
          if (countStream != null) {
            getChatClient().say(channelname, 'Du hast während dieses Streams ' + countStream + ' und gesamt ' + count + ' Nachrichten geschrieben.', { replyTo: msg });
          } else {
            getChatClient().say(channelname, 'Du hast ' + count + ' Nachrichten geschrieben.', { replyTo: msg });
          }
        } else {
          getChatClient().say(channelname, 'Du hast noch keine Nachrichten geschrieben.', { replyTo: msg });
        }
      }
      Cache.MessageCountCommandCooldown.set(msg.userInfo.userId, 'cooldown', Environment.Twitch.COMMAND_COOLDOWN);
    }
  }
}