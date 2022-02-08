import { EventSubListener, ReverseProxyAdapter } from '@twurple/eventsub';
import Environment from '../utils/environment';
import getAPIClient from '../helix/helixAPI';
import { readdirSync } from 'fs';
import * as logger from '../utils/logger';

const listener = new EventSubListener({
  apiClient: getAPIClient(),
  adapter: new ReverseProxyAdapter({
    hostName: Environment.Twitch.EventSub.URI,
    port: 3000,
  }),
  secret: Environment.Twitch.EventSub.SECRET,
});

export async function connectEventSubListener() {
  await listener.listen();
}

export function getEventSubListener(): EventSubListener {
  return listener;
}

export function registerEventSubListeners() {
  const files = readdirSync(`${__dirname}/listeners/`).filter((file) => file.endsWith('.js'));

  for (const file of files) {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Found eventsub listener ' + file + '...');
    require(`./listeners/${file}`);
  }
}

// only used for debug aspects
export async function debugEventSub() {
  (await getAPIClient().eventSub.getSubscriptions()).data.forEach(sub => {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'EventSub subscription found: ' + sub.id + ' - ' + sub.status + ' - ' + sub.type);
  });
  await getAPIClient().eventSub.deleteAllSubscriptions();
  logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Deleted all EventSub subscriptions');
}