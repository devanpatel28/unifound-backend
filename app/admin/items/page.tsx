'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

interface Item {
  id: string;
  item_name: string;
  item_type: 'lost' | 'found';
  location: string;
  date_lost_found: string;
  is_claimed: boolean;
  is_active: boolean;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
  };
  categories: {
    name: string;
  };
}

export default function ItemsPage() {
  const { token } = useAdmin();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let url = '/api/items?';
      if (filter !== 'all') {
        url += `type=${filter}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Items</h1>
        <p className="text-muted-foreground">
          Manage all lost and found items
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Items</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="lost">Lost Items</SelectItem>
                <SelectItem value="found">Found Items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading items...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Posted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.item_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.item_type === 'lost' ? 'destructive' : 'default'}
                      >
                        {item.item_type === 'lost' ? (
                          <><AlertCircle className="h-3 w-3 mr-1" /> Lost</>
                        ) : (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Found</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.categories.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.location}
                    </TableCell>
                    <TableCell>
                      {item.users.first_name} {item.users.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_claimed ? 'secondary' : 'outline'}>
                        {item.is_claimed ? 'Claimed' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(item.date_lost_found), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
