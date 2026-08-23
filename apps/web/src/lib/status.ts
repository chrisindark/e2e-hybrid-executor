export const STATUS_COLOR: Record<string, string> = {
  passed: '#22c55e',
  recovered: '#14b8a6',
  failed: '#ef4444',
  pending: '#94a3b8',
  running: '#f59e0b',
};

export const MODE_COLOR: Record<string, string> = {
  deterministic: '#60a5fa',
  agentic: '#c084fc',
  'deterministic-with-fallback': '#f59e0b',
  'agentic-primary': '#c084fc',
};

export function statusColor(status: string) {
  return STATUS_COLOR[status.toLowerCase()] ?? '#94a3b8';
}

export function statusStyle(status: string) {
  const color = statusColor(status);

  return {
    color,
    background: `${color}1f`,
    border: `1px solid ${color}66`,
  };
}
