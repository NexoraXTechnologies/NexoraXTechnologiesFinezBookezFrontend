import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const ProTrendLineChart = ({ title = 'Filing Trend', data }) => {
  const labels = data?.labels?.length >= 2 ? data.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filed = Array.isArray(data?.filed) && data.filed.length ? data.filed : [1, 2, 1, 3, 2, 4, 3];

  const draft = Array.isArray(data?.draft) && data.draft.length ? data.draft : [2, 1, 2, 1, 3, 2, 1];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Filed',
        data: filed,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderWidth: 3,
        tension: 0.35,
      },
      {
        label: 'Draft',
        data: draft,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 3,
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ProTrendLineChart;
