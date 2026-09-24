import { AnalyticsEvent, AnalyticsSummary, computeUpdatedSummary, createEmptySummary } from './analytics';

export interface ServerClickRecord {
  lastSeen: number;
  firstSeen24h: number;
  count24h: number;
}

export interface FraudEvaluationResult {
  isBot: boolean;
  isSpam: boolean;
  isUnique: boolean;
  reason: 'bot_ua' | 'rapid_click' | 'duplicate_24h' | 'unique_verified';
}

declare global {
  var __tripdee_server_analytics__: AnalyticsSummary | undefined;
  var __tripdee_anti_fraud_cache__: Map<string, ServerClickRecord> | undefined;
}

function getServerStore(): AnalyticsSummary {
  if (!globalThis.__tripdee_server_analytics__) {
    globalThis.__tripdee_server_analytics__ = createEmptySummary();
  }
  return globalThis.__tripdee_server_analytics__;
}

function getAntiFraudCache(): Map<string, ServerClickRecord> {
  if (!globalThis.__tripdee_anti_fraud_cache__) {
    globalThis.__tripdee_anti_fraud_cache__ = new Map();
  }
  return globalThis.__tripdee_anti_fraud_cache__;
}

const BOT_USER_AGENT_REGEX =
  /(bot|crawl|spider|slurp|headless|puppeteer|selenium|playwright|curl|wget|python|aiohttp|urllib|postman|node-fetch|insomnia|go-http-client)/i;

/**
 * Checks if User-Agent matches known bots, automated scrapers, or headless browsers
 */
export function isBotUserAgent(ua: string): boolean {
  if (!ua || ua.trim().length < 5) return true;
  return BOT_USER_AGENT_REGEX.test(ua);
}

/**
 * Masks IP address to protect privacy (PDPA / GDPR) while retaining subnet identity
 */
export function maskOrHashIp(ip: string): string {
  if (!ip) return '0.0.0.xxx';
  const clean = ip.trim();
  const parts = clean.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  return clean.slice(0, 16);
}

/**
 * Evaluates whether an incoming tracking request is genuine, rapid spam, duplicate, or a bot
 */
export function evaluateServerClickFraud(params: {
  ip: string;
  userAgent: string;
  visitorId?: string;
  targetKey: string;
}): FraudEvaluationResult {
  const { ip, userAgent, visitorId, targetKey } = params;
  const cache = getAntiFraudCache();
  const now = Date.now();

  // Check 1: Automated bot or scraper User-Agent
  if (isBotUserAgent(userAgent)) {
    return {
      isBot: true,
      isSpam: true,
      isUnique: false,
      reason: 'bot_ua',
    };
  }

  // Create composite identifier (Masked IP + Visitor Token + Target)
  const maskedIp = maskOrHashIp(ip);
  const clientKey = visitorId && visitorId.length > 5 ? `${maskedIp}:${visitorId}` : maskedIp;
  const cacheKey = `${clientKey}::${targetKey}`;
  const entry = cache.get(cacheKey);

  // Check 2: Rapid clicking (less than 2.5s between clicks on exact same target from same client)
  if (entry && now - entry.lastSeen < 2500) {
    entry.lastSeen = now;
    return {
      isBot: false,
      isSpam: true,
      isUnique: false,
      reason: 'rapid_click',
    };
  }

  // Check 3: 24h Unique Window (86,400,000 ms)
  const WINDOW_24H_MS = 24 * 60 * 60 * 1000;
  if (entry && now - entry.firstSeen24h < WINDOW_24H_MS) {
    entry.lastSeen = now;
    entry.count24h += 1;
    return {
      isBot: false,
      isSpam: false,
      isUnique: false,
      reason: 'duplicate_24h',
    };
  }

  // Unique verified interaction within 24h
  cache.set(cacheKey, {
    lastSeen: now,
    firstSeen24h: now,
    count24h: 1,
  });

  // Memory hygiene: maintain cache below 10,000 active entries
  if (cache.size > 10000) {
    for (const [k, v] of cache.entries()) {
      if (now - v.lastSeen > WINDOW_24H_MS) {
        cache.delete(k);
      }
    }
  }

  return {
    isBot: false,
    isSpam: false,
    isUnique: true,
    reason: 'unique_verified',
  };
}

export function recordServerAnalyticsEvent(event: AnalyticsEvent): AnalyticsSummary {
  const current = getServerStore();
  const updated = computeUpdatedSummary(current, event);
  globalThis.__tripdee_server_analytics__ = updated;
  return updated;
}

export function getServerAnalyticsSummary(): AnalyticsSummary {
  return getServerStore();
}

export function resetServerAnalytics(): AnalyticsSummary {
  const fresh = createEmptySummary();
  globalThis.__tripdee_server_analytics__ = fresh;
  if (globalThis.__tripdee_anti_fraud_cache__) {
    globalThis.__tripdee_anti_fraud_cache__.clear();
  }
  return fresh;
}
