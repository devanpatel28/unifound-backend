'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Package,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

interface ItemImage {
  url: string;
  file_id: string;
  thumbnail_url: string;
}

interface Item {
  id: string;
  item_name: string;
  item_type: 'lost' | 'found';
  location: string;
  date_lost_found: string;
  is_claimed: boolean;
  is_active: boolean;
  created_at: string;
  images: ItemImage[] | null;
  users: { first_name: string; last_name: string } | null;
  categories: { name: string } | null;
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  initialIndex,
  title,
  onClose,
}: {
  images: ItemImage[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  const current = images[idx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal box — stop propagation so clicking inside doesn't close */}
      <div
        className="relative flex flex-col items-center gap-3 max-w-3xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
        >
          <X className="h-7 w-7" />
        </button>

        {/* Image */}
        <div className="relative w-full bg-black rounded-xl overflow-hidden"
          style={{ aspectRatio: '4/3' }}>
          <Image
            key={current.url}
            src={current.url}
            alt={`${title} — image ${idx + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>

        {/* Navigation row */}
        {images.length > 1 && (
          <div className="flex items-center gap-4">
            <button
              onClick={prev}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-white/70 text-sm tabular-nums">
              {idx + 1} / {images.length}
            </span>
            <button
              onClick={next}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Thumbnail strip (if more than 1 image) */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.file_id}
                onClick={() => setIdx(i)}
                className={`relative h-14 w-14 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                  i === idx
                    ? 'border-white scale-110'
                    : 'border-white/30 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.thumbnail_url || img.url}
                  alt={`thumb ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Caption */}
        <p className="text-white/60 text-sm">{title}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ItemsPage() {
  const { token } = useAdmin();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    images: ItemImage[];
    index: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [filter, page]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/items?page=${page}&limit=20`;
      if (filter !== 'all') url += `&type=${filter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setItems(data.items ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return '—';
    }
  };

  const openLightbox = (item: Item, index = 0) => {
    if (!item.images || item.images.length === 0) return;
    setLightbox({ images: item.images, index, title: item.item_name ?? 'Item' });
  };

  return (
    <div className="p-8">
      {/* Lightbox portal */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Items</h1>
        <p className="text-muted-foreground">
          Manage all lost and found items ({total} total)
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
            <div className="text-center py-8 text-muted-foreground">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No items found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
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
                      {/* ── Image thumbnail ── */}
                      <TableCell>
                        {item.images && item.images.length > 0 ? (
                          <button
                            onClick={() => openLightbox(item)}
                            className="relative h-12 w-12 rounded-md overflow-hidden border bg-slate-100 shrink-0 cursor-zoom-in hover:ring-2 hover:ring-primary transition-all"
                            title={`View ${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                          >
                            <Image
                              src={item.images[0].thumbnail_url || item.images[0].url}
                              alt={item.item_name ?? 'Item image'}
                              fill
                              className="object-cover transition-transform hover:scale-110"
                              sizes="48px"
                            />
                            {item.images.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] font-bold px-1 rounded-tl">
                                +{item.images.length - 1}
                              </span>
                            )}
                          </button>
                        ) : (
                          <div className="h-12 w-12 rounded-md border bg-slate-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="font-medium">{item.item_name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={item.item_type === 'lost' ? 'destructive' : 'default'}>
                          {item.item_type === 'lost' ? (
                            <><AlertCircle className="h-3 w-3 mr-1" /> Lost</>
                          ) : (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Found</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.categories?.name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.location ?? '—'}</TableCell>
                      <TableCell>
                        {item.users
                          ? `${item.users.first_name ?? ''} ${item.users.last_name ?? ''}`.trim() || '—'
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={item.is_claimed ? 'secondary' : 'outline'}>
                            {item.is_claimed ? 'Claimed' : 'Active'}
                          </Badge>
                          {!item.is_active && (
                            <Badge variant="destructive">Deleted</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.date_lost_found)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
