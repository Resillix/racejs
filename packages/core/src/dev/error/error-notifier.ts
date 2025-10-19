/**
 * Error Notifier - External Integration Service
 *
 * Provides notification capabilities for error events:
 * - Console logging (default)
 * - Sentry (optional)
 * - Slack webhooks (optional)
 * - Email (optional)
 * - Custom webhooks (optional)
 *
 * Pattern: Strategy Pattern - different notification backends
 */

import { EnhancedError } from './types';
import { EventEmitter } from 'events';

/**
 * ErrorNotifier interface - defines contract for error notifications
 */
export interface ErrorNotifier {
  /**
   * Send notification for an error
   */
  notify(error: EnhancedError): Promise<void>;

  /**
   * Check if notifier is enabled
   */
  isEnabled(): boolean;
}

/**
 * Configuration for error notification service
 */
export interface ErrorNotifierConfig {
  /** Enable/disable notifications */
  enabled?: boolean;

  /** Console logging notifier */
  console?: {
    enabled?: boolean;
    level?: 'error' | 'warn' | 'info';
  };

  /** Sentry integration (optional) */
  sentry?: {
    enabled?: boolean;
    dsn?: string;
  };

  /** Slack webhook (optional) */
  slack?: {
    enabled?: boolean;
    webhookUrl?: string;
    channel?: string;
  };

  /** Discord webhook (optional) */
  discord?: {
    enabled?: boolean;
    webhookUrl?: string;
  };

  /** Email notifications (optional) */
  email?: {
    enabled?: boolean;
    to?: string[];
    // SMTP configuration would go here
  };

  /** Custom webhook (optional) */
  webhook?: {
    enabled?: boolean;
    url?: string;
    method?: 'POST' | 'PUT';
    headers?: Record<string, string>;
  };
}

/**
 * Console logging notifier (default, always available)
 */
export class ConsoleNotifier implements ErrorNotifier {
  private enabled: boolean;
  private level: 'error' | 'warn' | 'info';

  constructor(config: { enabled?: boolean; level?: 'error' | 'warn' | 'info' } = {}) {
    this.enabled = config.enabled !== false;
    this.level = config.level || 'error';
  }

  async notify(error: EnhancedError): Promise<void> {
    if (!this.enabled) return;

    const logFn = console[this.level] || console.error;
    logFn('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logFn(`🚨 Error: ${error.name}`);
    logFn(`📝 Message: ${error.message}`);
    if (error.route) {
      logFn(`📍 Route: ${error.method} ${error.route}`);
    }
    if (error.requestId) {
      logFn(`🔖 Request ID: ${error.requestId}`);
    }
    if (error.sourceContext) {
      logFn(`📂 File: ${error.sourceContext.file}:${error.sourceContext.line}`);
    }
    logFn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Webhook notifier for generic HTTP webhooks
 */
export class WebhookNotifier implements ErrorNotifier {
  private enabled: boolean;
  private url: string;
  private method: 'POST' | 'PUT';
  private headers: Record<string, string>;

  constructor(config: {
    enabled?: boolean;
    url: string;
    method?: 'POST' | 'PUT';
    headers?: Record<string, string>;
  }) {
    this.enabled = config.enabled !== false;
    this.url = config.url;
    this.method = config.method || 'POST';
    this.headers = config.headers || { 'Content-Type': 'application/json' };
  }

  async notify(error: EnhancedError): Promise<void> {
    if (!this.enabled) return;

    try {
      const payload = this.formatPayload(error);
      const response = await fetch(this.url, {
        method: this.method,
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Webhook notification failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to send webhook notification:', err);
    }
  }

  private formatPayload(error: EnhancedError): any {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      route: error.route,
      method: error.method,
      timestamp: error.timestamp,
      requestId: error.requestId,
      sourceContext: error.sourceContext,
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Slack notifier using webhooks
 */
export class SlackNotifier implements ErrorNotifier {
  private enabled: boolean;
  private webhookUrl: string;
  private channel: string | undefined;

  constructor(config: { enabled?: boolean; webhookUrl: string; channel?: string }) {
    this.enabled = config.enabled !== false;
    this.webhookUrl = config.webhookUrl;
    this.channel = config.channel;
  }

  async notify(error: EnhancedError): Promise<void> {
    if (!this.enabled) return;

    try {
      const payload = this.formatSlackMessage(error);
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Slack notification failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to send Slack notification:', err);
    }
  }

  private formatSlackMessage(error: EnhancedError): any {
    const statusEmoji = error.statusCode && error.statusCode >= 500 ? '🚨' : '⚠️';

    return {
      channel: this.channel,
      username: 'RaceJS Error Bot',
      icon_emoji: ':rotating_light:',
      text: `${statusEmoji} *${error.name}*: ${error.message}`,
      attachments: [
        {
          color: 'danger',
          fields: [
            {
              title: 'Route',
              value: `${error.method || 'N/A'} ${error.route || 'N/A'}`,
              short: true,
            },
            {
              title: 'Status Code',
              value: String(error.statusCode || 500),
              short: true,
            },
            {
              title: 'File',
              value: error.sourceContext
                ? `${error.sourceContext.file}:${error.sourceContext.line}`
                : 'N/A',
              short: false,
            },
            {
              title: 'Request ID',
              value: error.requestId || 'N/A',
              short: true,
            },
            {
              title: 'Timestamp',
              value: new Date(error.timestamp).toISOString(),
              short: true,
            },
          ],
          footer: 'RaceJS Dev Mode',
          ts: Math.floor(error.timestamp / 1000),
        },
      ],
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Error Notification Service
 * Manages multiple notifiers and coordinates error notifications
 *
 * Pattern: Composite Pattern - manages multiple notifiers
 */
export class ErrorNotificationService extends EventEmitter {
  private notifiers: ErrorNotifier[] = [];
  private enabled: boolean;

  constructor(config: ErrorNotifierConfig = {}) {
    super();
    this.enabled = config.enabled !== false;

    // Setup notifiers based on configuration
    this.setupNotifiers(config);
  }

  /**
   * Setup notifiers from configuration
   */
  private setupNotifiers(config: ErrorNotifierConfig): void {
    // Console notifier (always available)
    if (config.console?.enabled !== false) {
      this.notifiers.push(new ConsoleNotifier(config.console));
    }

    // Slack notifier
    if (config.slack?.enabled && config.slack.webhookUrl) {
      const slackConfig: { enabled?: boolean; webhookUrl: string; channel?: string } = {
        enabled: config.slack.enabled,
        webhookUrl: config.slack.webhookUrl,
      };
      if (config.slack.channel) {
        slackConfig.channel = config.slack.channel;
      }
      this.notifiers.push(new SlackNotifier(slackConfig));
    }

    // Discord notifier (similar to Slack)
    if (config.discord?.enabled && config.discord.webhookUrl) {
      this.notifiers.push(
        new WebhookNotifier({
          enabled: true,
          url: config.discord.webhookUrl,
          method: 'POST',
        })
      );
    }

    // Custom webhook
    if (config.webhook?.enabled && config.webhook.url) {
      const webhookConfig: {
        enabled?: boolean;
        url: string;
        method?: 'POST' | 'PUT';
        headers?: Record<string, string>;
      } = {
        enabled: config.webhook.enabled,
        url: config.webhook.url,
      };
      if (config.webhook.method) {
        webhookConfig.method = config.webhook.method;
      }
      if (config.webhook.headers) {
        webhookConfig.headers = config.webhook.headers;
      }
      this.notifiers.push(new WebhookNotifier(webhookConfig));
    }

    // Note: Sentry and Email would require additional dependencies
    // They can be added as optional peer dependencies later
  }

  /**
   * Send notification through all enabled notifiers
   */
  async notify(error: EnhancedError): Promise<void> {
    if (!this.enabled) return;

    // Notify all notifiers in parallel
    const promises = this.notifiers
      .filter((n) => n.isEnabled())
      .map((n) =>
        n.notify(error).catch((err) => {
          console.error('Notifier failed:', err);
        })
      );

    await Promise.all(promises);

    // Emit event for tracking
    this.emit('notified', error);
  }

  /**
   * Add a custom notifier
   */
  addNotifier(notifier: ErrorNotifier): void {
    this.notifiers.push(notifier);
  }

  /**
   * Remove a notifier
   */
  removeNotifier(notifier: ErrorNotifier): void {
    const index = this.notifiers.indexOf(notifier);
    if (index > -1) {
      this.notifiers.splice(index, 1);
    }
  }

  /**
   * Get all notifiers
   */
  getNotifiers(): ErrorNotifier[] {
    return [...this.notifiers];
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Create default error notification service
 */
export function createErrorNotifier(config?: ErrorNotifierConfig): ErrorNotificationService {
  return new ErrorNotificationService(config);
}
