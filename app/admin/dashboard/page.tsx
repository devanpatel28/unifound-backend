'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/app/components/admin/StatsCard';
import { getAdminToken } from '@/app/lib/adminAuth';
import { Users, Package, CheckCircle, XCircle, Clock, FolderTree } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatsCard
          title="Total Items"
          value={stats?.total_items || 0}
          icon={<Package size={24} />}
          color="purple"
        />
        <StatsCard
          title="Lost Items"
          value={stats?.lost_items || 0}
          icon={<XCircle size={24} />}
          color="red"
        />
        <StatsCard
          title="Found Items"
          value={stats?.found_items || 0}
          icon={<CheckCircle size={24} />}
          color="green"
        />
        <StatsCard
          title="Claimed Items"
          value={stats?.claimed_items || 0}
          icon={<Clock size={24} />}
          color="yellow"
        />
        <StatsCard
          title="Categories"
          value={stats?.total_categories || 0}
          icon={<FolderTree size={24} />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-500">Activity feed coming soon...</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
              View All Users
            </button>
            <button className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
              View All Items
            </button>
            <button className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
              Manage Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
