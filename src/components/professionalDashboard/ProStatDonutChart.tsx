import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

const ProStatDonutChart = ({ title, items = [] }) => {
  const chartData = {
    labels: items.map((i) => i.name),
    datasets: [
      {
        data: items.map((i) => i.value),
        backgroundColor: ['#34d399', '#fbbf24', '#f87171', '#60a5fa'],
        cutout: '70%',
        borderWidth: 0,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">Overview</span>
      </div>

      <div className="h-60">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ProStatDonutChart;
