'use client';

import { useEffect, useState } from 'react';
import { Package, MapPin, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/items' 
        : `/api/items?type=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Items Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter('lost')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'lost'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setFilter('found')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'found'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Found
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {item.images && item.images.length > 0 && (
              <img
                src={item.images[0].thumbnail_url || item.images[0].url}
                alt={item.item_name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{item.item_name}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.item_type === 'lost'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {item.item_type.toUpperCase()}
                </span>
              </div>

              {item.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Package size={16} className="mr-2" />
                  {item.categories?.name}
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  {item.location}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  {format(new Date(item.date_lost_found), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center text-gray-600">
                  <User size={16} className="mr-2" />
                  {item.users?.first_name} {item.users?.last_name}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                {item.is_claimed ? (
                  <span className="text-green-600 font-medium text-sm">✓ Claimed</span>
                ) : (
                  <span className="text-yellow-600 font-medium text-sm">◯ Unclaimed</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No items found</p>
        </div>
      )}
    </div>
  );
}
