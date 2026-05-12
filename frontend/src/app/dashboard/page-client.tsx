'use client';

import { useEffect, useState } from 'react';
import Notification from '@/components/Notification';

interface DashboardStats {
  total_equipment: number;
  total_borrowers: number;
  total_borrowed_items: number;
  total_returned_items: number;
  total_overdue_items: number;
  total_damaged_items: number;
  total_lost_items: number;
}

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats/');
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        setNotification({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to load dashboard',
        });
        setShowNotification(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen p-8 bg-gray-100">
        {notification && showNotification && (
          <Notification 
            type={notification.type} 
            message={notification.message}
            onClose={() => setShowNotification(false)}
          />
        )}
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      title: 'Total Equipment',
      value: stats.total_equipment,
      icon: '📦',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Borrowers',
      value: stats.total_borrowers,
      icon: '👥',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Currently Borrowed',
      value: stats.total_borrowed_items,
      icon: '📤',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Returned Items',
      value: stats.total_returned_items,
      icon: '📥',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Overdue Items',
      value: stats.total_overdue_items,
      icon: '⏰',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Damaged Items',
      value: stats.total_damaged_items,
      icon: '⚠️',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Lost Items',
      value: stats.total_lost_items,
      icon: '❌',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      {notification && showNotification && (
        <Notification 
          type={notification.type} 
          message={notification.message}
          onClose={() => setShowNotification(false)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Sports Equipment Borrowing System Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} rounded-lg shadow-md p-6 border-l-4 border-${card.color.split('-')[1]}-600 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">{card.title}</p>
                  <p className={`text-4xl font-bold ${card.color} mt-2`}>{card.value}</p>
                </div>
                <div className="text-4xl">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Equipment Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Equipment</span>
                <span className="font-semibold text-blue-600">{stats.total_equipment}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${((stats.total_equipment || 0) / (stats.total_equipment || 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Borrowing Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📈</span> Borrowing Activity
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Active Borrows</span>
                <span className="font-semibold text-purple-600">{stats.total_borrowed_items}</span>
              </div>
              <div className="text-sm text-gray-600">
                {stats.total_returned_items} items returned
              </div>
              <div className="text-sm text-gray-600">
                Completion rate: {stats.total_borrowed_items + stats.total_returned_items > 0
                  ? Math.round(
                      (stats.total_returned_items /
                        (stats.total_borrowed_items + stats.total_returned_items)) *
                        100,
                    )
                  : 0}%
              </div>
            </div>
          </div>

          {/* Issues Tracking */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚠️</span> Issues Tracking
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Overdue Items</span>
                <span className="font-semibold text-red-600">{stats.total_overdue_items}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Damaged Items</span>
                <span className="font-semibold text-orange-600">{stats.total_damaged_items}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Lost Items</span>
                <span className="font-semibold text-gray-600">{stats.total_lost_items}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Loan Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.total_borrowed_items + stats.total_returned_items > 0
                  ? Math.round(
                      (stats.total_returned_items /
                        (stats.total_borrowed_items + stats.total_returned_items)) *
                        100,
                    )
                  : 0}%
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Overdue Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.total_borrowed_items > 0
                  ? Math.round((stats.total_overdue_items / stats.total_borrowed_items) * 100)
                  : 0}%
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Damage Rate</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.total_returned_items > 0
                  ? Math.round((stats.total_damaged_items / stats.total_returned_items) * 100)
                  : 0}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Loss Rate</p>
              <p className="text-2xl font-bold text-gray-600">
                {stats.total_returned_items > 0
                  ? Math.round((stats.total_lost_items / stats.total_returned_items) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
