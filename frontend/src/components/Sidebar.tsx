import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  AlertOctagon,
  ShieldAlert,
  Wallet,
  Sparkles,
  Zap,
  Dna,
  X,
  Play
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openSimulator: () => void;
  openDNA: () => void;
  openDemoTour: () => void;
  immunityScore: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openSimulator,
  openDNA,
  openDemoTour,
  immunityScore,
  isOpen,
  onClose,
}) => {
  const routes = [
    { id: 'overview', name: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: Receipt },
    { id: 'anomalies', name: 'Anomalies & Court', icon: AlertOctagon },
    { id: 'antibodies', name: 'Immunity & Antibodies', icon: ShieldAlert },
    { id: 'budgets', name: 'Budgets & Forecast', icon: Wallet },
    { id: 'assistant', name: 'AI Assistant', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-navy-800 transition-all duration-300 ease-in-out flex flex-col justify-between shadow-xl shadow-shadow-500/10 dark:shadow-none border-r border-gray-100 dark:border-white/5 ${
          isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        }`}
      >
        <div>
          {/* Horizon UI Brand Title */}
          <div className="mx-[30px] mt-[32px] mb-[24px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-extrabold uppercase tracking-tight text-navy-700 dark:text-white font-poppins">
                HORIZON <span className="font-semibold text-brand-500">GUARD</span>
              </h1>
            </div>
            <button onClick={onClose} className="xl:hidden text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-px bg-gray-200 dark:bg-white/10 mb-6 mx-6" />

          {/* Navigation Links with Horizon UI Active Indicator Bar */}
          <ul className="mb-auto pt-1 space-y-1">
            {routes.map((route) => {
              const Icon = route.icon;
              const isActive = activeTab === route.id;

              return (
                <li key={route.id} className="relative my-1">
                  <button
                    onClick={() => {
                      setActiveTab(route.id);
                      onClose();
                    }}
                    className={`flex items-center gap-4 w-full py-3.5 px-7 text-left transition-all duration-200 ${
                      isActive
                        ? 'font-bold text-brand-500 dark:text-white'
                        : 'font-medium text-gray-600 dark:text-gray-400 hover:text-navy-700 dark:hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? 'text-brand-500 dark:text-white'
                          : 'text-gray-400 dark:text-gray-400'
                      }`}
                    />
                    <span className="text-sm tracking-wide">{route.name}</span>

                    {/* Horizon UI Signature Active Indicator Line */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-1 rounded-l-lg bg-brand-500 dark:bg-brand-400" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Horizon UI Promo / Status Card */}
        <div className="p-6">
          <div className="rounded-[20px] bg-gradient-to-br from-brand-400 to-brand-600 p-4 text-white shadow-xl shadow-brand-500/30 text-center relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="w-10 h-10 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>

            <h4 className="text-sm font-bold">Immunity Score: {immunityScore}%</h4>
            <p className="text-[11px] text-brand-100 mt-1 mb-3">
              Automated antibody protection against fraud vectors.
            </p>

            <button
              onClick={openDemoTour}
              className="w-full py-2.5 rounded-xl bg-white text-brand-600 text-xs font-bold shadow-md hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Take 2m Demo Tour</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
