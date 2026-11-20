import React from 'react';
import {
  Bot,
  ClipboardList,
  ClockAlert,
  Leaf,
  Package,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { LOCATIONS } from '../data/seedData';
import { LocationId, NavScreen } from '../types';

interface SidebarProps {
  activeScreen: NavScreen;
  onSelectScreen: (screen: NavScreen) => void;
  selectedLocation: LocationId;
  onSelectLocation: (loc: LocationId) => void;
  lowAndCriticalCount: number;
  expiringCount: number;
  openPOCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onResetDemoData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  selectedLocation,
  onSelectLocation,
  lowAndCriticalCount,
  expiringCount,
  openPOCount,
  mobileOpen,
  onCloseMobile,
  onResetDemoData,
}) => {
  const navItems: {
    id: NavScreen;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: 'inventory',
      label: 'Inventory Ledger',
      icon: <Package className="w-4 h-4 shrink-0" />,
      count: lowAndCriticalCount > 0 ? lowAndCriticalCount : undefined,
    },
    {
      id: 'orders',
      label: 'Purchase Orders',
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
      count: openPOCount > 0 ? openPOCount : undefined,
    },
    {
      id: 'par-expiry',
      label: 'Par & Expiry',
      icon: <ClockAlert className="w-4 h-4 shrink-0" />,
      count: expiringCount > 0 ? expiringCount : undefined,
    },
    {
      id: 'waste',
      label: 'Waste Log',
      icon: <Trash2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: <Truck className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'customer-rag',
      label: 'AI Chatbot & Concierge',
      icon: <Bot className="w-4 h-4 shrink-0 text-[#2D6A4F]" />,
    },
  ];

  const handleNavClick = (id: NavScreen) => {
    onSelectScreen(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E5E7EB]">
      {/* Brand Lockup */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-[#1B4332] text-white flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4" />
          </div>
          <span className="font-display text-[16px] font-bold tracking-[-0.02em] text-[#111827] whitespace-nowrap truncate">
            Artisan Commerce
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="xl:hidden p-1.5 rounded text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAF9]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Location Selector */}
      <div className="px-4 pt-5 pb-3">
        <label
          htmlFor="sidebar-location"
          className="block px-1.5 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]"
        >
          Operating Store
        </label>
        <select
          id="sidebar-location"
          value={selectedLocation}
          onChange={(e) => onSelectLocation(e.target.value as LocationId)}
          className="w-full h-9 px-2.5 text-[13px] font-medium text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
        >
          {LOCATIONS.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.label}
            </option>
          ))}
        </select>
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Primary operations navigation" className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
          Operations
        </p>
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74A892] ${
                isActive
                  ? 'bg-[#D8F3DC]/65 text-[#1B4332] font-semibold'
                  : 'text-[#374151] hover:bg-[#F8FAF9] hover:text-[#111827]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={isActive ? 'text-[#1B4332]' : 'text-[#6B7280]'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              {item.count !== undefined && (
                <span
                  className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-[#F3F4F6] text-[#374151]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Store Shift Footer */}
      <div className="p-4 border-t border-[#E5E7EB] space-y-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
            MR
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#111827] truncate">
              Maya Rivera
            </p>
            <p className="text-[12px] text-[#6B7280] truncate">
              Head of Operations
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onResetDemoData}
          className="w-full h-8 px-2.5 flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#414844] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9] hover:border-[#D1D5DB] transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Sample Data
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Persistent Desktop 240px Sidebar */}
      <aside className="hidden xl:block w-[240px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Collapsible Tablet/Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex">
          <div
            className="fixed inset-0 bg-[#111827]/35"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-[260px] max-w-[85vw] h-full z-10 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

// Export icon helper if needed elsewhere
export { ClipboardList };
