import { getStreamId } from './streamManager';
import { execute } from '../utils/database';

export async function getMessageCountTotal(userId: string, broadcasterId: string): Promise<number> {
  const result = await execute('SELECT COUNT(message) AS count FROM messages WHERE userId = ? AND broadcasterId = ?;', [userId, broadcasterId]);
  if (result.length == 1) {
    return parseInt(result[0].count);
  } else {
    return 0;
  }
}

export async function getMessageCountCurrentStream(userId: string, broadcasterId: string): Promise<number | null> {
  const streamId = await getStreamId(broadcasterId);
  if (streamId == null) {
    return null;
  }
  const result = await execute('SELECT COUNT(message) AS count FROM messages WHERE userId = ? AND broadcasterId = ? AND streamId = ?;', [userId, broadcasterId, streamId]);
  if (result.length == 1) {
    return parseInt(result[0].count);
  } else {
    return 0;
  }
}

export async function addMessage(userId: string, broadcasterId: string, message: string) {
  const streamId = await getStreamId(broadcasterId);
  await execute('INSERT INTO messages (broadcasterId, userId, streamId, message, created_at) VALUES (?, ?, ?, ?, NOW());', [broadcasterId, userId, streamId, message]);
}