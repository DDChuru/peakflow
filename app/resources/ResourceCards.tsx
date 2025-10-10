'use client';

import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';

type ResourceIcon = 'Layers';

interface ResourceCardItem {
  title: string;
  description: string;
  href: string;
  icon: ResourceIcon;
  badge?: string;
}

interface ResourceCardsProps {
  resources: ResourceCardItem[];
}

export default function ResourceCards({ resources }: ResourceCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {resources.map((resource) => {
        const Icon = resource.icon === 'Layers' ? Layers : Layers;
        return (
          <Link key={resource.href} href={resource.href} className="group">
            <Card className="h-full border border-slate-200/70 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  <Icon className="h-4 w-4" />
                  {resource.badge}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{resource.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{resource.description}</p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
