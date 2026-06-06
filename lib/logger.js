/**
 * Centralized Application Logger
 * Provides structured log formats for production diagnostics.
 */

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaString}`;
}

export const logger = {
  info: (message, meta) => {
    console.log(formatMessage('INFO', message, meta));
  },
  
  warn: (message, meta) => {
    console.warn(formatMessage('WARN', message, meta));
  },
  
  error: (message, error, meta) => {
    const errorDetails = error 
      ? `\nDetails: ${error.stack || error.message || error}`
      : '';
    console.error(formatMessage('ERROR', message, meta) + errorDetails);
  }
};
