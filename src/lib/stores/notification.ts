/**
 * Notification store for displaying toast/alert messages
 */

import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

function createNotificationStore() {
  const { subscribe, update } = writable<Notification[]>([]);

  return {
    subscribe,
    
    /**
     * Show a notification
     */
    show(type: Notification['type'], message: string, duration: number = 5000) {
      const id = Math.random().toString(36).substring(7);
      const notification: Notification = { id, type, message, duration };
      
      update(notifications => [...notifications, notification]);
      
      if (duration > 0) {
        setTimeout(() => {
          this.dismiss(id);
        }, duration);
      }
    },
    
    /**
     * Show success notification
     */
    success(message: string, duration?: number) {
      this.show('success', message, duration);
    },
    
    /**
     * Show error notification
     */
    error(message: string, duration?: number) {
      this.show('error', message, duration);
    },
    
    /**
     * Show info notification
     */
    info(message: string, duration?: number) {
      this.show('info', message, duration);
    },
    
    /**
     * Show warning notification
     */
    warning(message: string, duration?: number) {
      this.show('warning', message, duration);
    },
    
    /**
     * Dismiss a notification by ID
     */
    dismiss(id: string) {
      update(notifications => notifications.filter(n => n.id !== id));
    },
    
    /**
     * Clear all notifications
     */
    clear() {
      update(() => []);
    }
  };
}

export const notifications = createNotificationStore();

