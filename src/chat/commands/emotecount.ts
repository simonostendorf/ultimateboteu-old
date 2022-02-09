import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import Cache from '../../utils/cache';
import Environment from '../../utils/environment';
import { getChatClient } from '../chat';
import { getUserIdByName } from '../../helix/helixAPI';
import { EmoteType, getEmoteCountCurrentStream, getEmoteCountTotal, getEmoteId } from '../../managers/emoteManager';

export const name: string = '!emotecount';

// !emotecount [emoteProvider] [emoteName] <user>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handle(channelname: string, username: string, message: string, msg: TwitchPrivateMessage) {
  if (!msg.userInfo.isMod && !msg.userInfo.isBroadcaster) {
    return;
  }
  
  if (msg.channelId != null) {
    if (!await Cache.EmoteCountCommandCooldown.get(msg.userInfo.userId)) {
      if (message.split(' ').length == 4) {
        const emoteProvider: EmoteType = (<any>EmoteType)[message.split(' ')[1].toUpperCase()];
        if (!emoteProvider) {
          getChatClient().say(channelname, 'Der Emote-Anbieter ' + message.split(' ')[1] + ' konnte nicht gefunden werden.', { replyTo: msg });
          return;
        }
        const emoteName = message.split(' ')[2];
        const otherUsername = message.split(' ')[3].replace('@', '');
        const id = await getUserIdByName(otherUsername);
        if (!id) {
          getChatClient().say(channelname, 'Der Nutzer ' + otherUsername + ' konnte nicht gefunden werden.', { replyTo: msg });
          return;
        }
        const emoteId = await getEmoteId(emoteProvider, emoteName, msg.channelId);
        if (!emoteId) {
          getChatClient().say(channelname, 'Das ' + emoteProvider + ' Emote ' + emoteName + ' konnte nicht gefunden werden.', { replyTo: msg });
          return;
        }   
        const count = await getEmoteCountTotal(emoteId, emoteProvider, id, msg.channelId);
        const countStream = await getEmoteCountCurrentStream(emoteId, emoteProvider, id, msg.channelId);
        if (count > 0) {
          if (countStream != null) {
            getChatClient().say(channelname, 'Der Nutzer ' + otherUsername + ' hat während dieses Streams das Emote ' + emoteName + ' ' + countStream + ' Mal und gesamt ' + count + ' Mal verwendet.', { replyTo: msg });
          } else {
            getChatClient().say(channelname, 'Der Nutzer ' + otherUsername + ' hat das Emote ' + emoteName + ' ' + count + ' Mal verwendet.', { replyTo: msg });
          }
        } else {
          getChatClient().say(channelname, 'Der Nutzer ' + otherUsername + ' hat das Emote ' + emoteName + ' noch nicht verwendet.', { replyTo: msg });
        }
      } else if (message.split(' ').length == 3) {
        const emoteProvider: EmoteType = (<any>EmoteType)[message.split(' ')[1]];
        if (!emoteProvider) {
          getChatClient().say(channelname, 'Der Emote-Anbieter ' + message.split(' ')[1] + ' konnte nicht gefunden werden.', { replyTo: msg });
          return;
        }
        const emoteName = message.split(' ')[2];
        const emoteId = await getEmoteId(emoteProvider, emoteName, msg.channelId);
        if (!emoteId) {
          getChatClient().say(channelname, 'Das ' + emoteProvider + ' Emote ' + emoteName + ' konnte nicht gefunden werden.', { replyTo: msg });
          return;
        }   
        const count = await getEmoteCountTotal(emoteId, emoteProvider, msg.userInfo.userId, msg.channelId);
        const countStream = await getEmoteCountCurrentStream(emoteId, emoteProvider, msg.userInfo.userId, msg.channelId);
        if (count > 0) {
          if (countStream != null) {
            getChatClient().say(channelname, 'Du hast während dieses Streams das Emote ' + emoteName + ' ' + countStream + ' Mal und gesamt ' + count + ' Mal verwendet.', { replyTo: msg });
          } else {
            getChatClient().say(channelname, 'Du hast das Emote ' + emoteName + ' ' + count + ' Mal verwendet.', { replyTo: msg });
          }
        } else {
          getChatClient().say(channelname, 'Du hast das Emote ' + emoteName + ' noch nicht verwendet.', { replyTo: msg });
        }
      } else {
        getChatClient().say(channelname, 'Bitte verwende: !emotecount [emoteProvider: BTTV, FFZ, TWITCH] [emoteName] <username>', { replyTo: msg });
      }
      Cache.EmoteCountCommandCooldown.set(msg.userInfo.userId, 'cooldown', Environment.Twitch.COMMAND_COOLDOWN);
    }
  }
}