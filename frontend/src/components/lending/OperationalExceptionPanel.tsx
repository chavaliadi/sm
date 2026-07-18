import { ArrowRight, TriangleAlert } from 'lucide-react';

import { DateDisplay } from '@/components/common/DateDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RuntimeExceptionItem } from '@/lib/integrationRuntime';

interface OperationalExceptionPanelProps {
  title: string;
  description: string;
  items: RuntimeExceptionItem[];
  emptyTitle: string;
  emptySubtitle: string;
  highlightedItemId?: string | null;
  onOpenItem: (item: RuntimeExceptionItem) => void;
}

export function OperationalExceptionPanel({
  title,
  description,
  items,
  emptyTitle,
  emptySubtitle,
  highlightedItemId,
  onOpenItem,
}: OperationalExceptionPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-amber-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={TriangleAlert} />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={[
                'rounded-lg border p-4',
                highlightedItemId === item.id ? 'border-blue-300 bg-blue-50/60' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.sourceModule.replace(/_/g, ' ')}
                    {item.errorCode ? ` · ${item.errorCode}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill type="application" status={item.status} />
                  <StatusPill type="application" status={item.severity} />
                </div>
              </div>
              {item.details ? <p className="mt-2 text-sm text-slate-600">{item.details}</p> : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Created <DateDisplay date={item.createdAt} format="relative" />
                </div>
                <Button variant="outline" size="sm" onClick={() => onOpenItem(item)}>
                  Resolve now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
