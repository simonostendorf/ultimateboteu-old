# UltimateBotEU

[![GitHub](https://img.shields.io/github/license/simonostendorf/ultimateboteu)](https://github.com/simonostendorf/ultimateboteu/LICENSE)
[![CI](https://github.com/simonostendorf/ultimateboteu/actions/workflows/node.js.yml/badge.svg)](https://github.com/simonostendorf/ultimateboteu/actions/workflows/node.js.yml)

The ultimate twitch bot.  
Initially started to have a bot for the streamer [rezo](https://twitch.tv/rezo).

## Features

- Store and get chat message count for user, broadcaster or for a specific stream
- Store and get emote usages for user, broadcaster or for a specific stream including FrankerFaceZ and BetterTwitchTV emotes

More features comming soon.

## Installation

Use **docker** to install and deploy the bot. If you are not familiar with docker, you can get information about docker [here](https://www.docker.com/get-started).

To deploy the bot you need **docker-compose**.

Download the docker-compose.yml. Update the environment variables: Please fill in secure passwords and update the twitch client credentials. Run it with `docker-compose up -d` if you're in the same folder as the compose file.

## Dependencies

This bot uses the twurple javascript twitch api. You can find more information about that [here](https://twurple.js.org/).

To run the bot you need a running instance of [mariadb](https://mariadb.org/) and [redis](https://redis.io/). Inside the docker-compose file everything will be set up.

## Copyright and license

Licensed under [MIT](https://choosealicense.com/licenses/mit/).  
© 2022 by Simon Ostendorf. All rights reserved.
