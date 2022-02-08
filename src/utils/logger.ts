import Environment from './environment';

export const enum LogService {
  DATABASE = 'DATABASE',
  REDIS = 'REDIS',
  TWITCH = 'TWITCH',
}

export const enum LogMessageType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

function generateLogMessage(type: LogMessageType, service: LogService, message: string): string {
  return '[' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '] [' + type.toString() + '] [' + service.toString() + '] ' + message;
}

export function log(type: LogMessageType, service: LogService, message: string) {
  if (type !== LogMessageType.DEBUG || Environment.DEBUG) {
    switch (type) {
      case LogMessageType.DEBUG:
        console.debug(generateLogMessage(type, service, message));
        break;
      case LogMessageType.WARNING:
        console.warn(generateLogMessage(type, service, message));
        break;
      case LogMessageType.ERROR:
        console.error(generateLogMessage(type, service, message));
        break;
      default:
        console.log(generateLogMessage(type, service, message));
        break;
    }
  }
}