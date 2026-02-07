import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // 1. Write all logs to `combined.log`
    new winston.transports.File({ filename: 'combined.log' }),
    // 2. Write error logs to `error.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

// If we're not in production, log to the console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
