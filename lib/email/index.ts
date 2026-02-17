/**
 * tCredex Email System
 *
 * Usage:
 *
 * import { email } from '@/lib/email';
 *
 * // Send confirmation email
 * await email.confirmEmail('user@example.com', 'John', 'https://...');
 *
 * // Send CDE match notification
 * await email.cdeMatch('sponsor@example.com', 'John', 'Eastside Grocery', 'Midwest CDE', 'deal-123');
 *
 * // Send new message notification
 * await email.newMessage(
 *   'sponsor@example.com',
 *   'John',
 *   'Sarah Chen',
 *   'Midwest CDE',
 *   'Eastside Grocery',
 *   'Phase I looks good...',
 *   'deal-123'
 * );
 */

export * from "./templates";
export * from "./send";
export { email as default } from "./send";
