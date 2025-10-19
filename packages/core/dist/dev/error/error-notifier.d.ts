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
export declare class ConsoleNotifier implements ErrorNotifier {
    private enabled;
    private level;
    constructor(config?: {
        enabled?: boolean;
        level?: 'error' | 'warn' | 'info';
    });
    notify(error: EnhancedError): Promise<void>;
    isEnabled(): boolean;
}
/**
 * Webhook notifier for generic HTTP webhooks
 */
export declare class WebhookNotifier implements ErrorNotifier {
    private enabled;
    private url;
    private method;
    private headers;
    constructor(config: {
        enabled?: boolean;
        url: string;
        method?: 'POST' | 'PUT';
        headers?: Record<string, string>;
    });
    notify(error: EnhancedError): Promise<void>;
    private formatPayload;
    isEnabled(): boolean;
}
/**
 * Slack notifier using webhooks
 */
export declare class SlackNotifier implements ErrorNotifier {
    private enabled;
    private webhookUrl;
    private channel;
    constructor(config: {
        enabled?: boolean;
        webhookUrl: string;
        channel?: string;
    });
    notify(error: EnhancedError): Promise<void>;
    private formatSlackMessage;
    isEnabled(): boolean;
}
/**
 * Error Notification Service
 * Manages multiple notifiers and coordinates error notifications
 *
 * Pattern: Composite Pattern - manages multiple notifiers
 */
export declare class ErrorNotificationService extends EventEmitter {
    private notifiers;
    private enabled;
    constructor(config?: ErrorNotifierConfig);
    /**
     * Setup notifiers from configuration
     */
    private setupNotifiers;
    /**
     * Send notification through all enabled notifiers
     */
    notify(error: EnhancedError): Promise<void>;
    /**
     * Add a custom notifier
     */
    addNotifier(notifier: ErrorNotifier): void;
    /**
     * Remove a notifier
     */
    removeNotifier(notifier: ErrorNotifier): void;
    /**
     * Get all notifiers
     */
    getNotifiers(): ErrorNotifier[];
    /**
     * Enable/disable notifications
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if notifications are enabled
     */
    isEnabled(): boolean;
}
/**
 * Create default error notification service
 */
export declare function createErrorNotifier(config?: ErrorNotifierConfig): ErrorNotificationService;
//# sourceMappingURL=error-notifier.d.ts.map