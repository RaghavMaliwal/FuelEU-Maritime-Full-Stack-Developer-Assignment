import { useState } from "react";
import { AxiosApiClient } from "./adapters/infrastructure/apiClient.js";
import { RouteUseCases } from "./core/application/routeUseCases.js";
import { ComplianceUseCases } from "./core/application/complianceUseCases.js";
import { BankingUseCases } from "./core/application/bankingUseCases.js";
import { PoolingUseCases } from "./core/application/poolingUseCases.js";
import { RoutesTab } from "./adapters/ui/RoutesTab.js";
import { CompareTab } from "./adapters/ui/CompareTab.js";
import { BankingTab } from "./adapters/ui/BankingTab.js";
import { PoolingTab } from "./adapters/ui/PoolingTab.js";

// Initialize dependencies (hexagonal architecture)
const apiClient = new AxiosApiClient();
const routeUseCases = new RouteUseCases(apiClient);
const complianceUseCases = new ComplianceUseCases(apiClient);
const bankingUseCases = new BankingUseCases(apiClient);
const poolingUseCases = new PoolingUseCases(apiClient);

type Tab = "routes" | "compare" | "banking" | "pooling";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("routes");

  const tabs: { id: Tab; label: string }[] = [
    { id: "routes", label: "Routes" },
    { id: "compare", label: "Compare" },
    { id: "banking", label: "Banking" },
    { id: "pooling", label: "Pooling" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Fuel EU Maritime - Compliance Dashboard</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto">
        {activeTab === "routes" && <RoutesTab routeUseCases={routeUseCases} />}
        {activeTab === "compare" && <CompareTab routeUseCases={routeUseCases} />}
        {activeTab === "banking" && (
          <BankingTab
            bankingUseCases={bankingUseCases}
            complianceUseCases={complianceUseCases}
          />
        )}
        {activeTab === "pooling" && (
          <PoolingTab
            poolingUseCases={poolingUseCases}
            complianceUseCases={complianceUseCases}
          />
        )}
      </main>
    </div>
  );
}

export default App;


