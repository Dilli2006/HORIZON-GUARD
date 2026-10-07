import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HorizonNavbar } from './components/HorizonNavbar';
import { OverviewTab } from './pages/OverviewTab';
import { TransactionsTab } from './pages/TransactionsTab';
import { AnomaliesTab } from './pages/AnomaliesTab';
import { AntibodiesTab } from './pages/AntibodiesTab';
import { BudgetsTab } from './pages/BudgetsTab';
import { AssistantTab } from './pages/AssistantTab';

// Modals
import { CourtModal } from './components/CourtModal';
import { SimulatorModal } from './components/SimulatorModal';
import { ImpulseGuardModal } from './components/ImpulseGuardModal';
import { SpendDNAModal } from './components/SpendDNAModal';
import { VaccineModal } from './components/VaccineModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ReceiptScanModal } from './components/ReceiptScanModal';
import { ToastContainer } from './components/ToastContainer';
import { DemoTour } from './components/DemoTour';

// API & Hooks
import { api, SummaryData, AnomalyDetail, MerchantTrustItem, TimelinePoint } from './lib/api';
import { useSSE } from './hooks/useSSE';
import { motion, AnimatePresence } from 'framer-motion';
import { AuroraGlow } from './components/ui/AuroraGlow';

export function App() {
  const [darkMode, setDarkMode] = useState(false); // Default to Horizon light clean theme, with full dark mode toggle
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core data states
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyDetail[]>([]);
  const [trustMap, setTrustMap] = useState<Record<string, MerchantTrustItem>>({});
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  // Modal states
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyDetail | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isDNAOpen, setIsDNAOpen] = useState(false);
  const [isVaccineOpen, setIsVaccineOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isReceiptScanOpen, setIsReceiptScanOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);

  // Emotional Guard Trigger state
  const [guardData, setGuardData] = useState<{
    merchant: string;
    amount: number;
    category: string;
    reasons: string[];
    executeSave?: () => Promise<void>;
  } | null>(null);

  // AI prompt to pre-fill
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchCoreData = () => {
    api.getSummary().then(setSummary).catch(console.error);
    api.getAnomalies().then(setAnomalies).catch(console.error);
    api.getMerchantTrust().then(setTrustMap).catch(console.error);
    api.getTimeline().then(setTimeline).catch(console.error);
    setRefreshKey((k) => k + 1);
  };

  const handleRefresh = () => {
    fetchCoreData();
  };

  const { toasts, dismissToast } = useSSE(handleRefresh);

  useEffect(() => {
    fetchCoreData();
  }, []);

  // Sync dark class to root HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleReseed = async () => {
    setIsSeeding(true);
    try {
      await api.seed();
      fetchCoreData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenCourtById = (anomalyId: number) => {
    const a = anomalies.find((item) => item.id === anomalyId);
    if (a) {
      setSelectedAnomaly(a);
    } else {
      api.getAnomalies().then((list) => {
        const found = list.find((it) => it.id === anomalyId);
        if (found) setSelectedAnomaly(found);
      });
    }
  };

  const handleExplorePrompt = (prompt: string) => {
    setAssistantPrompt(prompt);
    setActiveTab('assistant');
  };

  const handleTourAction = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        setActiveTab('overview');
        break;
      case 1:
        setActiveTab('anomalies');
        break;
      case 2:
        if (anomalies.length > 0) {
          setSelectedAnomaly(anomalies[0]);
        }
        break;
      case 3:
        setActiveTab('antibodies');
        break;
      case 4:
        setIsSimulatorOpen(true);
        break;
      case 5:
        setIsAddExpenseOpen(true);
        break;
      case 6:
        setActiveTab('assistant');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full bg-lightPrimary dark:bg-navy-900 font-dm transition-colors overflow-x-hidden">
      {/* 21st.dev / React Bits Ambient Aurora Glow in canvas corners */}
      <AuroraGlow size="lg" className="-top-32 -right-32 opacity-40 dark:opacity-30" />
      <AuroraGlow size="md" className="top-1/2 -left-28 opacity-25 dark:opacity-20" />

      {/* 1. Horizon UI Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSimulator={() => setIsSimulatorOpen(true)}
        openDNA={() => setIsDNAOpen(true)}
        openDemoTour={() => setIsDemoTourOpen(true)}
        immunityScore={summary?.immunity?.score || 75}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Horizon Content Area */}
      <div className="relative z-10 h-full w-full xl:ml-72 flex flex-col min-h-screen">
        {/* Real-Time Floating SSE Toasts */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        <div className="p-4 sm:p-7 flex-1 flex flex-col gap-6">
          {/* Horizon Floating Header Navbar */}
          <HorizonNavbar
            activeTab={activeTab}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            openSimulator={() => setIsSimulatorOpen(true)}
            openAddExpense={() => setIsAddExpenseOpen(true)}
            openReceiptScan={() => setIsReceiptScanOpen(true)}
            onReseed={handleReseed}
            isSeeding={isSeeding}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          {/* Main Views Container with Framer Motion Page Transition */}
          <main className="flex-1">
            {summary ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                >
                  {activeTab === 'overview' && (
                    <OverviewTab
                      summary={summary}
                      timeline={timeline}
                      onOpenCourt={handleOpenCourtById}
                      onExplorePrompt={handleExplorePrompt}
                      onOpenDNA={() => setIsDNAOpen(true)}
                      onOpenVaccine={() => setIsVaccineOpen(true)}
                      anomalies={anomalies}
                      onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                      onOpenSimulator={() => setIsSimulatorOpen(true)}
                    />
                  )}
                  {activeTab === 'transactions' && (
                    <TransactionsTab
                      onOpenCourt={handleOpenCourtById}
                      trustMap={trustMap}
                      onRefresh={fetchCoreData}
                      refreshKey={refreshKey}
                      onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                    />
                  )}
                  {activeTab === 'anomalies' && (
                    <AnomaliesTab
                      anomalies={anomalies}
                      onOpenCourt={handleOpenCourtById}
                      onRefresh={fetchCoreData}
                    />
                  )}
                  {activeTab === 'antibodies' && (
                    <AntibodiesTab
                      onOpenVaccine={() => setIsVaccineOpen(true)}
                      onRefresh={fetchCoreData}
                    />
                  )}
                  {activeTab === 'budgets' && <BudgetsTab />}
                  {activeTab === 'assistant' && (
                    <AssistantTab
                      initialPrompt={assistantPrompt}
                      onClearInitialPrompt={() => setAssistantPrompt('')}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                <div className="w-12 h-12 rounded-2xl bg-brand-500 animate-spin flex items-center justify-center text-white font-bold">
                  HG
                </div>
                <p className="text-sm font-semibold">Initializing Horizon Financial Immune System...</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      <CourtModal
        anomaly={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onVerdictRecorded={() => {
          fetchCoreData();
          setSelectedAnomaly(null);
        }}
      />

      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onInjected={() => {
          fetchCoreData();
        }}
      />

      <SpendDNAModal
        isOpen={isDNAOpen}
        onClose={() => setIsDNAOpen(false)}
      />

      <VaccineModal
        isOpen={isVaccineOpen}
        onClose={() => setIsVaccineOpen(false)}
        onImportSuccess={() => {
          fetchCoreData();
        }}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAdded={() => {
          fetchCoreData();
          setRefreshKey((k) => k + 1);
        }}
        onTriggerImpulseGuard={(data, executeSave) => {
          setIsAddExpenseOpen(false);
          setGuardData({ ...data, executeSave });
        }}
      />

      <ImpulseGuardModal
        isOpen={!!guardData}
        onClose={() => setGuardData(null)}
        expenseData={guardData}
        onProceed={async () => {
          if (guardData?.executeSave) {
            await guardData.executeSave();
          }
          setGuardData(null);
        }}
        onCancelled={() => {
          setGuardData(null);
          fetchCoreData();
        }}
      />

      <ReceiptScanModal
        isOpen={isReceiptScanOpen}
        onClose={() => setIsReceiptScanOpen(false)}
        onSaved={fetchCoreData}
      />

      <DemoTour
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onStepAction={handleTourAction}
      />
    </div>
  );
}

export default App;
