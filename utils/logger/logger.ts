import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, context }) => {
      let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (context) {
        logMessage += ` | Context: ${JSON.stringify(context)}`;
      }
      return logMessage;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

const loggerService = {
  info: (message: string, context?: any) => logger.info(message, { context }),
  warn: (message: string, context?: any) => logger.warn(message, { context }),
  error: (message: string, context?: any) => logger.error(message, { context }),
};

export default loggerService; 