import dotenv from 'dotenv';

dotenv.config();

export default class Environment {
  static DEBUG = (process.env.DEBUG === 'true') ?? false;

  static Cache = class {
    static TWITCH_ID = parseInt(process.env.CACHE_TWITCH_ID ?? '1800000'); // default is 30 minutes
    static STREAM_ID = parseInt(process.env.CACHE_STREAM_ID ?? '60000'); // default is 1 minute
    static FFZ_EMOTES = parseInt(process.env.CACHE_FFZ_EMOTES ?? '1800000'); // default is 30 minutes
    static BTTV_EMOTES = parseInt(process.env.CACHE_BTTV_EMOTES ?? '1800000'); // default is 30 minutes
  };

  static Twitch = class {
    static CHANNELS = process.env.TWITCH_CHANNEL_NAMES?.split(';') || [];
    static COMMAND_COOLDOWN = parseInt(process.env.TWITCH_COMMAND_COOLDOWN ?? '10000'); // default is 10 seconds

    static Helix = class {
      static CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? '';
      static CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? '';
      static USER_ID = process.env.TWITCH_USER_ID ?? '';
    };

    static EventSub = class {
      static URI = process.env.TWITCH_EVENTSUB_URI ?? '';
      static SECRET = process.env.TWITCH_EVENTSUB_SECRET ?? '';
    };
  };

  static Database = class {
    static HOST = process.env.DB_HOST ?? '';
    static PORT = parseInt(process.env.DB_PORT ?? '3006');
    static DATABASE = process.env.DB_DATABASE ?? '';
    static USERNAME = process.env.DB_USERNAME ?? '';
    static PASSWORD = process.env.DB_PASSWORD ?? '';
  };

  static Redis = class {
    static HOST = process.env.REDIS_HOST ?? '';
    static PORT = parseInt(process.env.REDIS_PORT ?? '6379');
    static USERNAME = process.env.REDIS_USERNAME ?? '';
    static PASSWORD = process.env.REDIS_PASSWORD ?? '';
  };
}