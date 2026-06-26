import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface IssuesByTypeChartProps {
  data: {
    bug: number;
    task: number;
    improvement: number;
    feature: number;
  };
  onSegmentClick?: (type: string) => void;
}

export const IssuesByTypeChart: React.FC<IssuesByTypeChartProps> = ({ data, onSegmentClick }) => {
  const chartData = {
    labels: ['Bug', 'Task', 'Improvement', 'Feature'],
    datasets: [
      {
        data: [data.bug, data.task, data.improvement, data.feature],
        backgroundColor: [
          '#EF4444', // Red for bugs
          '#3B82F6', // Blue for tasks
          '#F59E0B', // Yellow for improvements
          '#10B981', // Green for features
        ],
        borderColor: [
          '#DC2626',
          '#2563EB',
          '#D97706',
          '#059669',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed * 100) / total).toFixed(1) : '0';
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && onSegmentClick) {
        const index = elements[0].index;
        const types = ['bug', 'task', 'improvement', 'feature'];
        onSegmentClick(types[index]);
      }
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

interface IssuesByPriorityChartProps {
  data: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  onBarClick?: (priority: string) => void;
}

export const IssuesByPriorityChart: React.FC<IssuesByPriorityChartProps> = ({ data, onBarClick }) => {
  const chartData = {
    labels: ['Urgent', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Issues',
        data: [data.urgent, data.high, data.medium, data.low],
        backgroundColor: [
          '#EF4444', // Red for urgent
          '#F97316', // Orange for high
          '#F59E0B', // Yellow for medium
          '#10B981', // Green for low
        ],
        borderColor: [
          '#DC2626',
          '#EA580C',
          '#D97706',
          '#059669',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && onBarClick) {
        const index = elements[0].index;
        const priorities = ['urgent', 'high', 'medium', 'low'];
        onBarClick(priorities[index]);
      }
    },
  };

  return <Bar data={chartData} options={options} />;
};

interface IssueTrendsChartProps {
  data: Array<{
    date: string;
    created: number;
    resolved: number;
  }>;
}

export const IssueTrendsChart: React.FC<IssueTrendsChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Created',
        data: data.map(item => item.created),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Resolved',
        data: data.map(item => item.resolved),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

interface AssignmentChartProps {
  data: {
    unassigned: number;
    assigned: Array<{
      id: string;
      name: string;
      count: number;
    }>;
  };
}

export const AssignmentChart: React.FC<AssignmentChartProps> = ({ data }) => {
  const labels = ['Unassigned', ...data.assigned.map(user => user.name)];
  const values = [data.unassigned, ...data.assigned.map(user => user.count)];
  
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Assigned Issues',
        data: values,
        backgroundColor: [
          '#6B7280', // Gray for unassigned
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4'
        ].slice(0, labels.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};