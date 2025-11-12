import { useState, useEffect } from "react";
import { PoolingUseCases } from "../../core/application/poolingUseCases.js";
import { ComplianceUseCases } from "../../core/application/complianceUseCases.js";
import type { PoolMember, PoolResult } from "../../core/domain/types.js";

interface PoolingTabProps {
  poolingUseCases: PoolingUseCases;
  complianceUseCases: ComplianceUseCases;
}

export function PoolingTab({ poolingUseCases, complianceUseCases }: PoolingTabProps) {
  const [year, setYear] = useState(2024);
  const [members, setMembers] = useState<PoolMember[]>([]);
  const [newShipId, setNewShipId] = useState("");
  const [newCb, setNewCb] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poolResult, setPoolResult] = useState<PoolResult | null>(null);

  const poolSum = members.reduce((sum, m) => sum + m.cb, 0);
  const isValidPool = poolSum >= 0 && members.length > 0;

  const handleAddMember = () => {
    const cb = parseFloat(newCb);
    if (!newShipId || isNaN(cb)) {
      setError("Please enter valid ship ID and CB");
      return;
    }
    if (members.some((m) => m.shipId === newShipId)) {
      setError("Ship ID already in pool");
      return;
    }
    setMembers([...members, { shipId: newShipId, cb }]);
    setNewShipId("");
    setNewCb("");
    setError(null);
  };

  const handleRemoveMember = (shipId: string) => {
    setMembers(members.filter((m) => m.shipId !== shipId));
  };

  const handleCreatePool = async () => {
    if (!isValidPool) {
      setError("Pool sum must be >= 0 and have at least one member");
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const result = await poolingUseCases.createPool(year, members);
      setPoolResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pool");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMembers([]);
    setPoolResult(null);
    setError(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Pooling (Article 21)</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {poolResult && (
        <div className="mb-4 p-4 bg-green-50 border border-green-400 rounded">
          <h3 className="font-semibold mb-2">Pool Created (ID: {poolResult.poolId})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left border">Ship ID</th>
                  <th className="px-2 py-1 text-left border">CB Before</th>
                  <th className="px-2 py-1 text-left border">CB After</th>
                </tr>
              </thead>
              <tbody>
                {poolResult.members.map((m) => (
                  <tr key={m.shipId}>
                    <td className="px-2 py-1 border">{m.shipId}</td>
                    <td className="px-2 py-1 border">{m.cbBefore.toLocaleString()}</td>
                    <td className="px-2 py-1 border">{m.cbAfter.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Year Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
          className="w-full md:w-48 p-2 border rounded"
        />
      </div>

      {/* Add Member */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ship ID</label>
          <input
            type="text"
            value={newShipId}
            onChange={(e) => setNewShipId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., SHIP001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adjusted CB</label>
          <input
            type="number"
            value={newCb}
            onChange={(e) => setNewCb(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., -50000"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAddMember}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Member
          </button>
        </div>
      </div>

      {/* Pool Sum Indicator */}
      <div className="mb-4 p-3 rounded border" style={{ backgroundColor: isValidPool ? "#dcfce7" : "#fee2e2" }}>
        <div className="font-semibold">
          Pool Sum: <span style={{ color: isValidPool ? "#16a34a" : "#dc2626" }}>
            {poolSum.toLocaleString()}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {isValidPool ? "✓ Valid pool (sum >= 0)" : "✗ Invalid pool (sum < 0)"}
        </div>
      </div>

      {/* Members List */}
      {members.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Pool Members</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left border">Ship ID</th>
                  <th className="px-4 py-2 text-left border">Adjusted CB</th>
                  <th className="px-4 py-2 text-left border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.shipId}>
                    <td className="px-4 py-2 border">{member.shipId}</td>
                    <td className="px-4 py-2 border">
                      {member.cb > 0 ? "+" : ""}
                      {member.cb.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border">
                      <button
                        onClick={() => handleRemoveMember(member.shipId)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleCreatePool}
          disabled={loading || !isValidPool}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          Create Pool
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
}


