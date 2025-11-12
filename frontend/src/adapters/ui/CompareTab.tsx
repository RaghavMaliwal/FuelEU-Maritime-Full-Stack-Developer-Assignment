import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ComparisonRow } from "../../core/domain/types.js";
import { RouteUseCases } from "../../core/application/routeUseCases.js";
import { TARGET_INTENSITY_2025 } from "../../shared/constants.js";

interface CompareTabProps {
  routeUseCases: RouteUseCases;
}

export function CompareTab({ routeUseCases }: CompareTabProps) {
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routeUseCases.fetchComparison();
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comparison");
    } finally {
      setLoading(false);
    }
  };

  const chartData = comparison.map((row) => ({
    routeId: row.routeId,
    baseline: row.baselineGhg,
    comparison: row.comparisonGhg,
    target: TARGET_INTENSITY_2025,
  }));

  if (loading) {
    return <div className="p-6 text-center">Loading comparison data...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Compare</h2>
      <p className="mb-4 text-gray-600">
        Target Intensity: <strong>{TARGET_INTENSITY_2025} gCO₂e/MJ</strong> (2% below 91.16)
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {comparison.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No comparison data available. Please set a baseline route first.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mb-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="routeId" />
                <YAxis label={{ value: "gCO₂e/MJ", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#fbbf24" name="Baseline" />
                <Bar dataKey="comparison" fill="#3b82f6" name="Comparison" />
                <Bar dataKey="target" fill="#10b981" name="Target (89.3368)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left border">Route ID</th>
                  <th className="px-4 py-2 text-left border">Baseline GHG (gCO₂e/MJ)</th>
                  <th className="px-4 py-2 text-left border">Comparison GHG (gCO₂e/MJ)</th>
                  <th className="px-4 py-2 text-left border">% Difference</th>
                  <th className="px-4 py-2 text-left border">Compliant</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.routeId}>
                    <td className="px-4 py-2 border">{row.routeId}</td>
                    <td className="px-4 py-2 border">{row.baselineGhg.toFixed(2)}</td>
                    <td className="px-4 py-2 border">{row.comparisonGhg.toFixed(2)}</td>
                    <td className="px-4 py-2 border">
                      {row.percentDiff > 0 ? "+" : ""}
                      {row.percentDiff.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.compliant ? (
                        <span className="text-green-600 font-bold">✅</span>
                      ) : (
                        <span className="text-red-600 font-bold">❌</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


