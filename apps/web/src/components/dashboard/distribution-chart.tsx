'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { DistributionBucket } from '@acme/shared';
import { formatNumber } from '@/lib/format';

/**
 * Histogram of salary spread. The API clamps the upper bound at p99, so a
 * handful of executive salaries don't flatten every other bucket.
 */
export function DistributionChart({ buckets }: { buckets: DistributionBucket[] }) {
  const data = buckets.map((b) => ({
    range: `$${Math.round(b.lowerUsd / 1000)}K`,
    fullRange: `$${formatNumber(Math.round(b.lowerUsd))} – $${formatNumber(Math.round(b.upperUsd))}`,
    count: b.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
        <XAxis
          dataKey="range"
          tick={{ fontSize: 11, fill: '#78716c' }}
          tickLine={false}
          axisLine={{ stroke: '#e7e5e4' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#78716c' }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f4' }}
          contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e7e5e4' }}
          formatter={(value) => [`${formatNumber(Number(value))} employees`, '']}
          labelFormatter={(_, payload) => payload?.[0]?.payload.fullRange ?? ''}
        />
        <Bar dataKey="count" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
