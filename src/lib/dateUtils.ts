/**
 * Format order creation age into clean, human-readable English:
 * - Within 1 min: "Just now"
 * - Within 60 mins: "15m ago"
 * - Within 24 hrs: "2h 15m ago" or "3h ago"
 * - Older than 24 hrs / days ago: "Oct 15, 2:30 PM" (or "3d ago (Oct 15)")
 */
export function formatOrderAge(dateInput: string | number | Date): string {
  if (!dateInput) return 'Just now';
  const created = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
  if (isNaN(created)) return 'Just now';

  const now = Date.now();
  const diffMs = Math.max(0, now - created);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;

  if (diffHours < 24) {
    if (remMinutes === 0) {
      return `${diffHours}h ago`;
    }
    return `${diffHours}h ${remMinutes}m ago`;
  }

  // Days ago or older
  const dateObj = new Date(created);
  const currentYear = new Date().getFullYear();
  const isThisYear = dateObj.getFullYear() === currentYear;

  const dateStr = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' }),
  });

  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return `Yesterday, ${timeStr}`;
  }
  if (diffDays <= 7) {
    return `${diffDays}d ago (${dateStr})`;
  }

  return `${dateStr}, ${timeStr}`;
}

/**
 * Format complete date and time for order detail sheets/modals.
 */
export function formatFullDateTime(dateInput: string | number | Date): string {
  if (!dateInput) return 'N/A';
  const d = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
