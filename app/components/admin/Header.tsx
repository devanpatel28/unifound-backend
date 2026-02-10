'use client';

import { useEffect, useState } from 'react';
import { getAdminUser } from '@/app/lib/adminAuth';
import { Bell, User } from 'lucide-react';
import { adminUser } from '@/types';

export default function Header() {
  const [admin, setAdmin] = useState<adminUser | null>(null);

  useEffect(() => {
    setAdmin(getAdminUser());
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
          <p className="text-gray-500 text-sm">Manage your university lost and found system</p>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="font-medium text-gray-900">{admin?.full_name || 'Admin'}</p>
              <p className="text-sm text-gray-500">{admin?.username || ''}</p>
            </div>
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
