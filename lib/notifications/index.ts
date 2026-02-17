/**
 * tCredex Notification System
 * 
 * Usage:
 * 
 * import { notify } from '@/lib/notifications';
 * 
 * // Send a CDE match notification
 * await notify.cdeMatch(dealId, 'Eastside Grocery', 'Midwest CDE');
 * 
 * // Send a status change notification
 * await notify.statusChanged(dealId, 'Eastside Grocery', 'Closing');
 * 
 * // Or use the raw emitter
 * import { emitNotification } from '@/lib/notifications';
 * await emitNotification({ event: 'deal_approved', dealId, project_name: 'Eastside Grocery' });
 */

export * from './rules';
export * from './emit';
