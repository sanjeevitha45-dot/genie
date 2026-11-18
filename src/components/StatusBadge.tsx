import React from 'react';
import { POStatus, StockHealth } from '../types';

interface StockHealthBadgeProps {
  health: StockHealth;
  customLabel?: string;
}

const HEALTH_STYLES: Record<
  StockHealth,
  { bg: string; text: string; dot: string; label: string }
> = {
  optimal: {
    bg: 'bg-[#D8F3DC]',
    text: 'text-[#1B4332]',
    dot: 'bg-[#1B4332]',
    label: 'In Stock',
  },
  low: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    dot: 'bg-[#D97706]',
    label: 'Low Stock',
  },
  critical: {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#991B1B]',
    dot: 'bg-[#DC2626]',
    label: 'Critical',
  },
  expiring: {
    bg: 'bg-[#EDE9FE]',
    text: 'text-[#5B21B6]',
    dot: 'bg-[#7C3AED]',
    label: 'Expiring Soon',
  },
};

export const StockHealthBadge: React.FC<StockHealthBadgeProps> = ({
  health,
  customLabel,
}) => {
  const style = HEALTH_STYLES[health];
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11px] font-semibold tracking-[0.03em] whitespace-nowrap shrink-0 ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      <span>{customLabel ?? style.label}</span>
    </span>
  );
};

interface POStatusBadgeProps {
  status: POStatus;
}

const PO_STYLES: Record<POStatus, { bg: string; text: string; dot: string }> = {
  Draft: {
    bg: 'bg-[#F3F4F6]',
    text: 'text-[#374151]',
    dot: 'bg-[#6B7280]',
  },
  Ordered: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    dot: 'bg-[#D97706]',
  },
  'In Transit': {
    bg: 'bg-[#EDE9FE]',
    text: 'text-[#5B21B6]',
    dot: 'bg-[#7C3AED]',
  },
  Received: {
    bg: 'bg-[#D8F3DC]',
    text: 'text-[#1B4332]',
    dot: 'bg-[#1B4332]',
  },
};

export const POStatusBadge: React.FC<POStatusBadgeProps> = ({ status }) => {
  const style = PO_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11px] font-semibold tracking-[0.03em] whitespace-nowrap shrink-0 ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};
