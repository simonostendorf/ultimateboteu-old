import mariadb from 'mariadb';
import Environment from './environment';
import * as logger from './logger';

let connection: mariadb.PoolConnection | null;

const pool = mariadb.createPool({
  host: Environment.Database.HOST,
  port: Environment.Database.PORT,
  database: Environment.Database.DATABASE,
  user: Environment.Database.USERNAME,
  password: Environment.Database.PASSWORD,
  connectionLimit: 3,
  connectTimeout: 8000,
});

export async function connectDatabase() {
  if (!connection) {
    try {
      logger.log(logger.LogMessageType.DEBUG, logger.LogService.DATABASE, 'Trying to connect to the database...');
      connection = await pool.getConnection();
      logger.log(logger.LogMessageType.INFO, logger.LogService.DATABASE, 'Successfully connected to database.');
    } catch (error) {
      throw error;
    }
  }
}

export async function disconnect() {
  if (connection) {
    logger.log(logger.LogMessageType.DEBUG, logger.LogService.DATABASE, 'Trying to disconnect from the database...');
    connection.end();
    connection = null;
    logger.log(logger.LogMessageType.INFO, logger.LogService.DATABASE, 'Successfully disconnected from the database.');
  }
}

export async function execute(sql: string, values?: Array<any>): Promise<any> {
  try {
    if (connection && connection.isValid()) {
      logger.log(logger.LogMessageType.DEBUG, logger.LogService.DATABASE, 'Executing SQL statement "' + sql + '" with parameters ' + values + '.');
      const rows = await connection.query(sql, values);
      return rows;
    } else {
      logger.log(logger.LogMessageType.WARNING, logger.LogService.DATABASE, 'Database connection not established. Please run connect() before executing database statements.');
      await connectDatabase();
      return await execute(sql, values);
    }
  } catch (error) {
    throw error;
  }
}

export async function createTables() {
  await execute('CREATE TABLE IF NOT EXISTS tokens ('
    + 'userId INT NOT NULL,'
    + 'accessToken VARCHAR(200) NOT NULL,'
    + 'expiresIn INT NOT NULL DEFAULT 0,'
    + 'obtainmentTimestamp TIMESTAMP NOT NULL DEFAULT NOW(),'
    + 'refreshToken VARCHAR(200) NOT NULL,'
    + 'scope TEXT NOT NULL DEFAULT \'{}\','
    + 'PRIMARY KEY (userId)'
    + ');');

  await execute('CREATE TABLE IF NOT EXISTS messages ('
    + 'id INT AUTO_INCREMENT NOT NULL,'
    + 'broadcasterId INT NOT NULL,'
    + 'userId INT NOT NULL,'
    + 'streamId BIGINT DEFAULT NULL,'
    + 'message VARCHAR(200) NOT NULL,'
    + 'created_at TIMESTAMP NOT NULL DEFAULT NOW(),'
    + 'PRIMARY KEY (id)'
    + ');');

  await execute('CREATE TABLE IF NOT EXISTS emotes ('
    + 'id INT AUTO_INCREMENT NOT NULL,'
    + 'broadcasterId INT NOT NULL,'
    + 'userId INT NOT NULL,'
    + 'streamId BIGINT DEFAULT NULL,'
    + 'emoteTypeId INT NOT NULL,'
    + 'emoteId TEXT NOT NULL,'
    + 'created_at TIMESTAMP NOT NULL DEFAULT NOW(),'
    + 'PRIMARY KEY (id)'
    + ');');

  await execute('CREATE TABLE IF NOT EXISTS emoteTypes ('
    + 'id INT AUTO_INCREMENT NOT NULL,'
    + 'name VARCHAR(50) NOT NULL,'
    + 'PRIMARY KEY (id)'
    + ');');

  await execute('CREATE TABLE IF NOT EXISTS streams ('
    + 'streamId BIGINT NOT NULL,'
    + 'broadcasterId INT NOT NULL,'
    + 'startDate TIMESTAMP NOT NULL DEFAULT NOW(),'
    + 'endDate TIMESTAMP,'
    + 'PRIMARY KEY (streamId)'
    + ');');

  await execute('CREATE TABLE IF NOT EXISTS streamData ('
    + 'id INT AUTO_INCREMENT NOT NULL,'
    + 'streamId BIGINT DEFAULT NULL,'
    + 'title TEXT NOT NULL,'
    + 'gameId INT NOT NULL,'
    + 'viewers INT DEFAULT NULL,'
    + 'created_at TIMESTAMP NOT NULL DEFAULT NOW(),'
    + 'PRIMARY KEY (id)'
    + ');');

  await execute('ALTER TABLE messages ADD CONSTRAINT message_has_streamId FOREIGN KEY IF NOT EXISTS (streamId) REFERENCES streams(streamId);');
  await execute('ALTER TABLE emotes ADD CONSTRAINT emote_has_streamId FOREIGN KEY IF NOT EXISTS (streamId) REFERENCES streams(streamId);');
  await execute('ALTER TABLE emotes ADD CONSTRAINT emote_has_emoteTypeId FOREIGN KEY IF NOT EXISTS (emoteTypeId) REFERENCES emoteTypes(id);');
  await execute('ALTER TABLE streamData ADD CONSTRAINT streamData_has_streamId FOREIGN KEY IF NOT EXISTS (streamId) REFERENCES streams(streamId);');
  
  await execute('INSERT INTO emoteTypes (name) SELECT * FROM (SELECT ?) AS tmp WHERE NOT EXISTS (SELECT name FROM emoteTypes WHERE name = ?) LIMIT 1;', ['TWITCH', 'TWITCH']);
  await execute('INSERT INTO emoteTypes (name) SELECT * FROM (SELECT ?) AS tmp WHERE NOT EXISTS (SELECT name FROM emoteTypes WHERE name = ?) LIMIT 1;', ['BTTV', 'BTTV']);
  await execute('INSERT INTO emoteTypes (name) SELECT * FROM (SELECT ?) AS tmp WHERE NOT EXISTS (SELECT name FROM emoteTypes WHERE name = ?) LIMIT 1;', ['FFZ', 'FFZ']);
}