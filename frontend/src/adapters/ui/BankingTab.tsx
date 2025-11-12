import { useState, useEffect } from "react";
import { BankingUseCases } from "../../core/application/bankingUseCases.js";
import { ComplianceUseCases } from "../../core/application/complianceUseCases.js";
import type { BankRecord, BankingResult } from "../../core/domain/types.js";

interface BankingTabProps {
  bankingUseCases: BankingUseCases;
  complianceUseCases: ComplianceUseCases;
}

export function BankingTab({ bankingUseCases, complianceUseCases }: BankingTabProps) {
  const [shipId, setShipId] = useState("SHIP001");
  const [year, setYear] = useState(2024);
  const [cb, setCb] = useState<number | null>(null);
  const [adjustedCb, setAdjustedCb] = useState<number | null>(null);
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyAmount, setApplyAmount] = useState("");
  const [bankingResult, setBankingResult] = useState<BankingResult | null>(null);

  useEffect(() => {
    loadData();
  }, [shipId, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cbData, adjustedData, records] = await Promise.all([
        complianceUseCases.fetchComplianceBalance(shipId, year).catch(() => null),
        complianceUseCases.fetchAdjustedComplianceBalance(shipId, year).catch(() => null),
        bankingUseCases.fetchBankRecords(shipId, year).catch(() => []),
      ]);
      setCb(cbData?.cb ?? null);
      setAdjustedCb(adjustedData?.adjustedCb ?? null);
      setBankRecords(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleBank = async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await bankingUseCases.bankSurplus(shipId, year);
      setBankingResult(result);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to bank surplus");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const result = await bankingUseCases.applyBanked(shipId, year, amount);
      setBankingResult(result);
      setApplyAmount("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply banked amount");
    } finally {
      setLoading(false);
    }
  };

  const bankedSum = bankRecords.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Banking (Article 20)</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {bankingResult && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <strong>Operation successful:</strong> CB before: {bankingResult.cb_before.toLocaleString()}, 
          Applied: {bankingResult.applied.toLocaleString()}, 
          CB after: {bankingResult.cb_after.toLocaleString()}
        </div>
      )}

      {/* Inputs */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ship ID</label>
          <input
            type="text"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm text-gray-600">CB Before</div>
          <div className="text-2xl font-bold">
            {cb !== null ? cb.toLocaleString() : "N/A"}
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <div className="text-sm text-gray-600">Banked Sum</div>
          <div className="text-2xl font-bold">{bankedSum.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded">
          <div className="text-sm text-gray-600">Adjusted CB</div>
          <div className="text-2xl font-bold">
            {adjustedCb !== null ? adjustedCb.toLocaleString() : "N/A"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleBank}
          disabled={loading || !cb || cb <= 0}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Bank Surplus
        </button>
        <div className="flex gap-2">
          <input
            type="number"
            value={applyAmount}
            onChange={(e) => setApplyAmount(e.target.value)}
            placeholder="Amount to apply"
            className="px-3 py-2 border rounded"
            disabled={loading || bankedSum <= 0}
          />
          <button
            onClick={handleApply}
            disabled={loading || bankedSum <= 0 || !applyAmount}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            Apply Banked
          </button>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {/* Bank Records Table */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">Bank Records</h3>
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left border">ID</th>
              <th className="px-4 py-2 text-left border">Ship ID</th>
              <th className="px-4 py-2 text-left border">Year</th>
              <th className="px-4 py-2 text-left border">Amount</th>
              <th className="px-4 py-2 text-left border">Created At</th>
            </tr>
          </thead>
          <tbody>
            {bankRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-2 border text-center text-gray-500">
                  No bank records found
                </td>
              </tr>
            ) : (
              bankRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-2 border">{record.id}</td>
                  <td className="px-4 py-2 border">{record.shipId}</td>
                  <td className="px-4 py-2 border">{record.year}</td>
                  <td className="px-4 py-2 border">
                    {record.amount > 0 ? "+" : ""}
                    {record.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border">
                    {new Date(record.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


