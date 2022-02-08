import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import Environment from './environment';

const keyvRedis = new KeyvRedis('redis://' + Environment.Redis.USERNAME + ':' + Environment.Redis.PASSWORD + '@' + Environment.Redis.HOST + ':' + Environment.Redis.PORT);
const keyvTwitchIds = new Keyv({ store: keyvRedis, namespace: 'twitchIds' }); //key: broadcasterName, value: broadcasterId
const keyvStreamIds = new Keyv({ store: keyvRedis, namespace: 'streamIds' }); //key: broadcasterId, value: streamId
const keyvStreamViewers = new Keyv({ store: keyvRedis, namespace: 'streamViewes' }); //key: broadcasterId, value: streamViewers
const bttvEmotes = new Map<string, Keyv>(); //Map_key: broadcasterId, Map_value: (key: emoteName, value: emoteId)
const ffzEmotes = new Map<string, Keyv>(); //Map_key: broadcasterId, Map_value: (key: emoteName, value: emoteId)
const keyvtwitchEmotes = new Keyv({ store: keyvRedis, namespace: 'twitchEmotes' }); //key: emoteName, value: emoteId
const keyvMessageCountCommandCooldown = new Keyv({ store: keyvRedis, namespace: 'CMD-COOLDOWN_messagecount' }); //key: userId, value: 'cooldown'
const keyvEmoteCountCommandCooldown = new Keyv({ store: keyvRedis, namespace: 'CMD-COOLDOWN_emotecount' }); //key: userId, value: 'cooldown'

export default class Cache {
  static TwitchIds = class {
    public static get(broadcasterName: string): Promise<string | undefined> {
      return keyvTwitchIds.get(broadcasterName);
    }
    public static set(broadcasterName: string, broadcasterId: string, milliseconds: number): Promise<true> {
      return keyvTwitchIds.set(broadcasterName, broadcasterId, milliseconds);
    }
  };

  static StreamIds = class {
    public static get(broadcasterId: string): Promise<string | undefined> {
      return keyvStreamIds.get(broadcasterId);
    }
    public static set(broadcasterId: string, streamId: string, milliseconds: number): Promise<true> {
      return keyvStreamIds.set(broadcasterId, streamId, milliseconds);
    }
  };

  static StreamViewers = class {
    public static async get(broadcasterId: string): Promise<number | undefined> {
      const value = await keyvStreamViewers.get(broadcasterId);
      if (value) {
        return parseInt(value);
      }
      return undefined;
    }
    public static set(broadcasterId: string, viewers: number, milliseconds: number): Promise<true> {
      return keyvStreamViewers.set(broadcasterId, viewers.toString(), milliseconds);
    }
  };

  static BTTVEmotes = class {
    public static isSetup(broadcasterId: string): boolean {
      if (bttvEmotes.has(broadcasterId) && bttvEmotes.get(broadcasterId)?.get('TIMER')) {
        return true;
      }
      return false;
    }
    public static async get(broadcasterId: string, emoteName: string): Promise<string | undefined> {
      if (this.isSetup(broadcasterId)) {
        return bttvEmotes.get(broadcasterId)?.get(emoteName);
      }
      return undefined;
    }
    public static set(broadcasterId: string, emoteName: string, emoteId: string, milliseconds: number): Promise<true> | undefined {
      if (!this.isSetup(broadcasterId)) {
        bttvEmotes.set(broadcasterId, new Keyv({ store: keyvRedis, namespace: 'BTTV_' + broadcasterId }));
      }
      return bttvEmotes.get(broadcasterId)?.set(emoteName, emoteId, milliseconds);
    }
  };

  static FFZEmotes = class {
    public static isSetup(broadcasterId: string): boolean {
      if (ffzEmotes.has(broadcasterId) && ffzEmotes.get(broadcasterId)?.get('TIMER')) {
        return true;
      }
      return false;
    }
    public static async get(broadcasterId: string, emoteName: string): Promise<string | undefined> {
      if (this.isSetup(broadcasterId)) {
        return ffzEmotes.get(broadcasterId)?.get(emoteName);
      }
      return undefined;
    }
    public static set(broadcasterId: string, emoteName: string, emoteId: string, milliseconds: number): Promise<true> | undefined {
      if (!this.isSetup(broadcasterId)) {
        ffzEmotes.set(broadcasterId, new Keyv({ store: keyvRedis, namespace: 'FFZ_' + broadcasterId }));
      }
      return ffzEmotes.get(broadcasterId)?.set(emoteName, emoteId, milliseconds);
    }
  };

  static TwitchEmotes = class {
    public static get(emoteName: string): Promise<string | undefined> {
      return keyvtwitchEmotes.get(emoteName);
    }
    public static set(emoteName: string, emoteId: string): Promise<true> {
      return keyvtwitchEmotes.set(emoteName, emoteId);
    }
  };

  static MessageCountCommandCooldown = class {
    public static get(userId: string): Promise<string | undefined> {
      return keyvMessageCountCommandCooldown.get(userId);
    }
    public static set(userId: string, value: string, milliseconds: number): Promise<true> {
      return keyvMessageCountCommandCooldown.set(userId, value, milliseconds);
    }
  };

  static EmoteCountCommandCooldown = class {
    public static get(userId: string): Promise<string | undefined> {
      return keyvEmoteCountCommandCooldown.get(userId);
    }
    public static set(userId: string, value: string, milliseconds: number): Promise<true> {
      return keyvEmoteCountCommandCooldown.set(userId, value, milliseconds);
    }
  };
}