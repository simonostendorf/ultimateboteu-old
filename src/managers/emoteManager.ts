import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import axios from 'axios';
import Cache from '../utils/cache';
import { execute } from '../utils/database';
import { getStreamId } from './streamManager';
import * as logger from '../utils/logger';
import Environment from '../utils/environment';
import getAPIClient from '../helix/helixAPI';

export enum EmoteType {
  TWITCH = 'TWITCH',
  BTTV = 'BTTV',
  FFZ = 'FFZ',
}

async function callAPI(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url);
    if (response.status == 200) {
      return response.data;
    }
  } catch (err) {
    return null;
  }
  return null;
}

async function isBTTVEmote(broadcasterId: string, message: string): Promise<string | undefined> {
  if (!Cache.BTTVEmotes.isSetup(broadcasterId)) {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'BTTV emote names from broadcaster ' + broadcasterId + ' not found inside the cache. Getting it from the bttv api...');
    const emoteNames = await callAPI('https://api.betterttv.net/3/cached/users/twitch/' + broadcasterId);
    if (!emoteNames) {
      logger.log(logger.LogMessageType.ERROR, logger.LogService.TWITCH, 'BTTV emote api call from broadcaster ' + broadcasterId + ' failed. The returned names are undefined.');
    } else {
      const json = JSON.parse(JSON.stringify(emoteNames));
      for (let emote of json.channelEmotes) {
        Cache.BTTVEmotes.set(broadcasterId, emote.code, emote.id, Environment.Cache.BTTV_EMOTES);
        logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Found BBTV emote ' + emote.code + ' from broadcaster ' + broadcasterId);
      }
      for (let emote of json.sharedEmotes) {
        Cache.BTTVEmotes.set(broadcasterId, emote.code, emote.id, Environment.Cache.BTTV_EMOTES);
        logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Found BBTV emote ' + emote.code + ' from broadcaster ' + broadcasterId);
      }
    }
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Got BTTV emotes from broadcaster ' + broadcasterId + ' from the bttv api and saved it to the cache.');
  } else {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Read BTTV emotes from broadcaster ' + broadcasterId + ' from the cache.');
  }
  return Cache.BTTVEmotes.get(broadcasterId, message);
}

async function isFFZEmote(broadcasterId: string, message: string): Promise<string | undefined> {
  if (!Cache.FFZEmotes.isSetup(broadcasterId)) {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'FFZ emote names from broadcaster ' + broadcasterId + ' not found inside the cache. Getting it from the ffz api...');
    const emoteNames = await callAPI('https://api.frankerfacez.com/v1/room/id/' + broadcasterId);
    if (!emoteNames) {
      logger.log(logger.LogMessageType.ERROR, logger.LogService.TWITCH, 'FFZ emote api call from broadcaster ' + broadcasterId + ' failed. The returned names are undefined.');
    } else {
      const json = JSON.parse(JSON.stringify(emoteNames));
      for (let ffzSet of Object.keys(json.sets)) {
        logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Found FFZ emote set ' + ffzSet + ' from broadcaster ' + broadcasterId);
        for (let emote of json.sets[ffzSet].emoticons) {
          Cache.FFZEmotes.set(broadcasterId, emote.name, emote.id, Environment.Cache.FFZ_EMOTES);
          logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Found FFZ emote ' + emote.name + ' from broadcaster ' + broadcasterId);
        }
      }
    }
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Got FFZ emotes from broadcaster ' + broadcasterId + ' from the ffz api and saved it to the cache.');
  } else {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Read FFZ emotes from broadcaster ' + broadcasterId + ' from the cache.');
  }
  return Cache.FFZEmotes.get(broadcasterId, message);
}

async function addEmote(userId: string, broadcasterId: string, emoteId: string, emoteType: EmoteType) {
  const streamId = await getStreamId(broadcasterId);
  await execute('INSERT INTO emotes (broadcasterId, userId, streamId, emoteTypeId, emoteId, created_at) VALUES (?, ?, ?, (SELECT id FROM emoteTypes WHERE name = \'' + emoteType.toString() + '\'), ?, NOW());', [broadcasterId, userId, streamId, emoteId]);
}

async function checkTwitchEmotes(userId: string, broadcasterId: string, message: string, msg: TwitchPrivateMessage) {
  msg.parseEmotes().forEach(element => {
    if (element.type == 'emote') {
      Cache.TwitchEmotes.set(element.name, element.id);
      addEmote(userId, broadcasterId, element.id, EmoteType.TWITCH);
    }
  });
}

async function checkBTTVEmotes(userId: string, broadcasterId: string, message: string) {
  message.split(' ').forEach(async (element) => {
    const emoteId = await isBTTVEmote(broadcasterId, element);
    if (emoteId) {
      addEmote(userId, broadcasterId, emoteId, EmoteType.BTTV);
    }
  });
}

async function checkFFZEmotes(userId: string, broadcasterId: string, message: string) {
  message.split(' ').forEach(async (element) => {
    const emoteId = await isFFZEmote(broadcasterId, element);
    if (emoteId) {
      addEmote(userId, broadcasterId, emoteId, EmoteType.FFZ);
    }
  });
}

export async function checkEmotes(userId: string, broadcasterId: string, message: string, msg: TwitchPrivateMessage) {
  checkTwitchEmotes(userId, broadcasterId, message, msg);
  checkBTTVEmotes(userId, broadcasterId, message);
  checkFFZEmotes(userId, broadcasterId, message);
}

export async function getEmoteId(emoteProvider: EmoteType, emoteName: string, broadcasterId: string): Promise<string | undefined> {
  switch (emoteProvider) {
    case EmoteType.BTTV:
      return isBTTVEmote(broadcasterId, emoteName);
    case EmoteType.FFZ:
      return isFFZEmote(broadcasterId, emoteName);
    case EmoteType.TWITCH:
      //emotes from the broadcaster
      const emotes = await getAPIClient().chat.getChannelEmotes(broadcasterId);
      for (const e of emotes) {
        if (e.name == emoteName) {
          return e.id;
        }
      }
      //twitch global emotes
      const emotes2 = await getAPIClient().chat.getGlobalEmotes();
      for (const e of emotes2) {
        if (e.name == emoteName) {
          return e.id;
        }
      }
      //emotes that were used before
      const result = Cache.TwitchEmotes.get(emoteName);
      if (result) {
        return result;
      }
      return undefined;
    default:
      return undefined;
  }
}

export async function getEmoteCountTotal(emoteId: string, emoteProvider: EmoteType, userId: string, broadcasterId: string): Promise<number> {
  const result = await execute('SELECT COUNT(id) AS count FROM emotes WHERE userId = ? AND broadcasterId = ? AND emoteId = ? AND emoteTypeId = (SELECT id FROM emoteTypes WHERE name = ?);', [userId, broadcasterId, emoteId, emoteProvider.toString()]);
  if (result.length == 1) {
    return parseInt(result[0].count);
  } else {
    return 0;
  }
}

export async function getEmoteCountCurrentStream(emoteId: string, emoteProvider: EmoteType, userId: string, broadcasterId: string): Promise<number | null> {
  const streamId = await getStreamId(broadcasterId);
  if (streamId == null) {
    return null;
  }
  const result = await execute('SELECT COUNT(id) AS count FROM emotes WHERE userId = ? AND broadcasterId = ? AND emoteId = ? AND streamId = ? AND emoteTypeId = (SELECT id FROM emoteTypes WHERE name = ?);', [userId, broadcasterId, emoteId, streamId, emoteProvider.toString()]);
  if (result.length == 1) {
    return parseInt(result[0].count);
  } else {
    return 0;
  }
}