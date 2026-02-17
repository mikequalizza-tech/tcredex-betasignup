'use client';

interface WatchlistItem {
  id: string;
  project_name: string;
  watch_reason: string;
  added_at: string;
  severity: 'low' | 'medium' | 'high';
}

interface WatchlistPanelProps {
  items?: WatchlistItem[];
  onDismiss?: (id: string) => void;
}

const severityColors = {
  low: 'border-yellow-600 bg-yellow-900/20',
  medium: 'border-orange-600 bg-orange-900/20',
  high: 'border-red-600 bg-red-900/20',
};

const severityLabels = {
  low: 'Low',
  medium: 'Medium', 
  high: 'High Priority',
};

export default function WatchlistPanel({ items = [], onDismiss }: WatchlistPanelProps) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-800/30 rounded-xl border border-gray-700">
        <p>No items on watchlist</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-100">Watchlist</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li 
            key={item.id} 
            className={`border rounded-lg p-4 ${severityColors[item.severity]}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-100">{item.project_name}</div>
                <div className="text-sm text-gray-400 mt-1">{item.watch_reason}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  item.severity === 'high' ? 'bg-red-600 text-white' :
                  item.severity === 'medium' ? 'bg-orange-600 text-white' :
                  'bg-yellow-600 text-black'
                }`}>
                  {severityLabels[item.severity]}
                </span>
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(item.id)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Added: {new Date(item.added_at).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
