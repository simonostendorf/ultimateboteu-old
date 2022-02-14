import { getUserIdByName } from '../../helix/helixAPI';
import Environment from '../../utils/environment';
import { getEventSubListener } from '../eventsub';
import * as logger from '../../utils/logger';
import { addStreamData, getStreamId, getStreamViewers } from '../../managers/streamManager';

Environment.Twitch.CHANNELS.forEach(async (name: string) => {
  const id = await getUserIdByName(name);
  if (id) {
    await getEventSubListener().subscribeToChannelUpdateEvents(id, async (e) => {
      const streamId = await getStreamId(e.broadcasterId);
      const viewer = await getStreamViewers(e.broadcasterId);
      addStreamData(streamId, e.streamTitle, e.categoryId, viewer);
      logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'The channel from the broadcaster ' + e.broadcasterDisplayName + ' with the id ' + e.broadcasterId + ' got updated.');
    });
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Registered channel update listener for channel ' + name);
  } else {
    logger.log(logger.LogMessageType.ERROR, logger.LogService.TWITCH, 'Could not register channel update listener for channel ' + name + ' because twitch api failed.');
  }
});