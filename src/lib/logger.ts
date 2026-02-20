// Structured logging utility for auditing (HU-22, HU-38)

type LogLevel = "info" | "warn" | "error" | "audit";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  actor?: string;
  action?: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    env: process.env.NODE_ENV,
    app: "motojusta",
  });
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(formatLog({ level: "info", message, timestamp: new Date().toISOString(), metadata: meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(formatLog({ level: "warn", message, timestamp: new Date().toISOString(), metadata: meta }));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(formatLog({ level: "error", message, timestamp: new Date().toISOString(), metadata: meta }));
  },
  audit: (actor: string, action: string, target: string, meta?: Record<string, unknown>) => {
    console.log(
      formatLog({
        level: "audit",
        message: `[AUDIT] ${actor} -> ${action} -> ${target}`,
        timestamp: new Date().toISOString(),
        actor,
        action,
        target,
        metadata: meta,
      })
    );
  },
};
