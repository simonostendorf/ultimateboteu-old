//import { debugEventSub } from './eventsub/eventsub';
import { connectEventSubListener, registerEventSubListeners } from './eventsub/eventsub';
import { registerChatClient } from './chat/chat';
import { registerCommands } from './chat/commandManager';
import { connectDatabase, createTables } from './utils/database';

(async () => {
  //await debugEventSub();

  //database
  await connectDatabase();
  await createTables();

  //chat
  await registerChatClient();
  registerCommands();

  //eventsub
  await connectEventSubListener();
  registerEventSubListeners();
})();