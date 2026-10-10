export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tripdeeth.com';
export const OFFICIAL_LINE_URL = 'https://lin.ee/SYKrWJB';
export const OFFICIAL_FACEBOOK_URL = 'https://web.facebook.com/profile.php?id=61594476213767';


/**
 * Feature flag to enable/disable QR Deposit Payment (ChillPay / PromptPay).
 * Set to false to temporarily hide QR payment UI without deleting any implementation code.
 * Set to true to re-enable QR payment instantly.
 */
export const ENABLE_QR_PAYMENT = false;
