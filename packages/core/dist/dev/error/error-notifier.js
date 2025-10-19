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
import { EventEmitter } from 'events';
/**
 * Console logging notifier (default, always available)
 */
export class ConsoleNotifier {
    enabled;
    level;
    constructor(config = {}) {
        this.enabled = config.enabled !== false;
        this.level = config.level || 'error';
    }
    async notify(error) {
        if (!this.enabled)
            return;
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
    isEnabled() {
        return this.enabled;
    }
}
/**
 * Webhook notifier for generic HTTP webhooks
 */
export class WebhookNotifier {
    enabled;
    url;
    method;
    headers;
    constructor(config) {
        this.enabled = config.enabled !== false;
        this.url = config.url;
        this.method = config.method || 'POST';
        this.headers = config.headers || { 'Content-Type': 'application/json' };
    }
    async notify(error) {
        if (!this.enabled)
            return;
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
        }
        catch (err) {
            console.error('Failed to send webhook notification:', err);
        }
    }
    formatPayload(error) {
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
    isEnabled() {
        return this.enabled;
    }
}
/**
 * Slack notifier using webhooks
 */
export class SlackNotifier {
    enabled;
    webhookUrl;
    channel;
    constructor(config) {
        this.enabled = config.enabled !== false;
        this.webhookUrl = config.webhookUrl;
        this.channel = config.channel;
    }
    async notify(error) {
        if (!this.enabled)
            return;
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
        }
        catch (err) {
            console.error('Failed to send Slack notification:', err);
        }
    }
    formatSlackMessage(error) {
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
    isEnabled() {
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
    notifiers = [];
    enabled;
    constructor(config = {}) {
        super();
        this.enabled = config.enabled !== false;
        // Setup notifiers based on configuration
        this.setupNotifiers(config);
    }
    /**
     * Setup notifiers from configuration
     */
    setupNotifiers(config) {
        // Console notifier (always available)
        if (config.console?.enabled !== false) {
            this.notifiers.push(new ConsoleNotifier(config.console));
        }
        // Slack notifier
        if (config.slack?.enabled && config.slack.webhookUrl) {
            const slackConfig = {
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
            this.notifiers.push(new WebhookNotifier({
                enabled: true,
                url: config.discord.webhookUrl,
                method: 'POST',
            }));
        }
        // Custom webhook
        if (config.webhook?.enabled && config.webhook.url) {
            const webhookConfig = {
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
    async notify(error) {
        if (!this.enabled)
            return;
        // Notify all notifiers in parallel
        const promises = this.notifiers
            .filter((n) => n.isEnabled())
            .map((n) => n.notify(error).catch((err) => {
            console.error('Notifier failed:', err);
        }));
        await Promise.all(promises);
        // Emit event for tracking
        this.emit('notified', error);
    }
    /**
     * Add a custom notifier
     */
    addNotifier(notifier) {
        this.notifiers.push(notifier);
    }
    /**
     * Remove a notifier
     */
    removeNotifier(notifier) {
        const index = this.notifiers.indexOf(notifier);
        if (index > -1) {
            this.notifiers.splice(index, 1);
        }
    }
    /**
     * Get all notifiers
     */
    getNotifiers() {
        return [...this.notifiers];
    }
    /**
     * Enable/disable notifications
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Check if notifications are enabled
     */
    isEnabled() {
        return this.enabled;
    }
}
/**
 * Create default error notification service
 */
export function createErrorNotifier(config) {
    return new ErrorNotificationService(config);
}
//# sourceMappingURL=error-notifier.js.map