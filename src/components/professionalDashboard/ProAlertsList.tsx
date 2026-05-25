import React from 'react';

const badge = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-green-50 text-green-700 border-green-200',
};

const ProAlertsList = ({ items = [] }) => {
  if (!items.length) {
    return <p className="text-sm text-gray-500">No alerts 🎉</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((a, idx) => (
        <div key={idx} className={`p-3 rounded-lg border text-sm ${badge[a.type] || badge.info}`}>
          <p className="font-semibold">{a.title}</p>
          <p className="text-xs mt-1 opacity-90">{a.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ProAlertsList;
