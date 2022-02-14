import { execute } from '../utils/database';
import getAPIClient from '../helix/helixAPI';
import Cache from '../utils/cache';
import Environment from '../utils/environment';
import * as logger from '../utils/logger';

async function checkAndAddStreamStart(broadcasterId: string, streamId: string, startDate: Date) {
  const result = await execute('SELECT * FROM streams WHERE broadcasterId = ? AND streamId = ?;', [broadcasterId, streamId]);
  if (result.length == 0) {
    await execute('INSERT INTO streams (streamId, broadcasterId, startDate, endDate) VALUES (?, ?, ?, NULL);', [streamId, broadcasterId, startDate]);
    logger.log(logger.LogMessageType.INFO, logger.LogService.TWITCH, 'The broadcaster ' + broadcasterId + ' started streaming!');
  }
}

async function checkAndAddStreamEnd(broadcasterId: string, endDate: Date) {
  const result = await execute('SELECT streamId, endDate FROM streams WHERE broadcasterId = ? ORDER BY startDate DESC LIMIT 1;', [broadcasterId]);
  if (result.length > 0 && !result[0].endDate) {
    await execute('UPDATE streams SET endDate = ? WHERE broadcasterId = ? AND streamId = ?;', [endDate, broadcasterId, result[0].streamId]);
    logger.log(logger.LogMessageType.INFO, logger.LogService.TWITCH, 'The broadcaster ' + broadcasterId + ' finished streaming!');
  }
}

export async function addStreamData(streamId: string | null, title: string, gameId: string, viewers: number | null) {
  await execute('INSERT INTO streamData (streamId, title, gameId, viewers, created_at) VALUES (?, ?, ?, ?, NOW());', [streamId, title, gameId, viewers]);
}

async function addStreamDataViewers(broadcasterId: string, streamId: string, viewers: number) {
  const result = await execute('SELECT title, gameId FROM streamData WHERE streamId = ? ORDER BY id DESC LIMIT 1;', [streamId]);
  if (result.length == 1) {
    await addStreamData(streamId, result[0].title, result[0].gameId, viewers);
  } else {
    //never added stream title to db. getting it from helix api
    const stream = await getAPIClient().streams.getStreamByUserId(broadcasterId);
    if (stream) {
      await addStreamData(streamId, stream.title, stream.gameId, viewers);
      logger.log(logger.LogMessageType.WARNING, logger.LogService.TWITCH, 'Found no stream data inside the database but want to update the stream viewer from an active stream. Getting the data from the twitch helix api...');
    } else {
      throw new Error('Some undefined error happened. Bot wants to update the viewer count of an active stream but there is no stream data inside the database and the twitch api has no stream data.');
    }
  }
}

export async function getStreamViewers(broadcasterId: string): Promise<number | null> {
  let cachedViewers = await Cache.StreamViewers.get(broadcasterId);
  if (!cachedViewers) {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Stream viewers from broadcaster ' + broadcasterId + ' not found inside the cache. Getting it from the twitch api...');
    const helixStream = await getAPIClient().streams.getStreamByUserId(broadcasterId);
    if (!helixStream) {
      cachedViewers = -1;
    } else {
      cachedViewers = helixStream.viewers;

      //insert new viewerCount inside the database
      logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Updating the viewer count inside the database for broadcaster ' + broadcasterId + '.');
      await addStreamDataViewers(broadcasterId, helixStream.id, cachedViewers);
    }
    await Cache.StreamViewers.set(broadcasterId, cachedViewers, Environment.Cache.STREAM_ID);
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Got stream viewers ' + cachedViewers + ' from broadcaster ' + broadcasterId + ' from the twitch api and saved it to the cache.');
  } else {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Read stream viewers ' + cachedViewers + ' from broadcaster ' + broadcasterId + ' from the cache.');
  }
  if (cachedViewers == -1) {
    return null;
  }

  return cachedViewers;
}

export async function getStreamId(broadcasterId: string): Promise<string | null> {
  let cachedID = await Cache.StreamIds.get(broadcasterId);
  if (!cachedID) {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Stream id from broadcaster ' + broadcasterId + ' not found inside the cache. Getting it from the twitch api...');
    const helixStream = await getAPIClient().streams.getStreamByUserId(broadcasterId);
    if (!helixStream) {
      cachedID = 'null';

      //insert new stream inside the database
      logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Ckecking for updating the current stream inside the database for broadcaster ' + broadcasterId + '.');
      await checkAndAddStreamEnd(broadcasterId, new Date());
    } else {
      cachedID = helixStream.id;

      //insert new stream inside the database
      logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Checking for updating the current stream inside the database for broadcaster ' + broadcasterId + '.');
      await checkAndAddStreamStart(broadcasterId, cachedID, helixStream.startDate);
    }
    await Cache.StreamIds.set(broadcasterId, cachedID, Environment.Cache.STREAM_ID);
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Got stream id ' + cachedID + ' from broadcaster ' + broadcasterId + ' from the twitch api and saved it to the cache.');
  } else {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.TWITCH, 'Read stream id ' + cachedID + ' from broadcaster ' + broadcasterId + ' from the cache.');
  }
  if (cachedID == 'null') {
    return null;
  }

  //if stream id is not null: check viewer count and update it
  await getStreamViewers(broadcasterId);

  return cachedID;
}