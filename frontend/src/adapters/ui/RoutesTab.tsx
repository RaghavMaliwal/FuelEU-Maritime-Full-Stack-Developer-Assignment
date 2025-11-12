import { useState, useEffect } from "react";
import type { Route } from "../../core/domain/types.js";
import { RouteUseCases } from "../../core/application/routeUseCases.js";

interface RoutesTabProps {
  routeUseCases: RouteUseCases;
}

export function RoutesTab({ routeUseCases }: RoutesTabProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    vesselType: "",
    fuelType: "",
    year: "",
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routeUseCases.fetchAllRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  const handleSetBaseline = async (routeId: number) => {
    try {
      await routeUseCases.setBaselineRoute(routeId);
      await loadRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set baseline");
    }
  };

  const filteredRoutes = routes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year.toString() !== filters.year) return false;
    return true;
  });

  const uniqueVesselTypes = Array.from(new Set(routes.map((r) => r.vesselType))).sort();
  const uniqueFuelTypes = Array.from(new Set(routes.map((r) => r.fuelType))).sort();
  const uniqueYears = Array.from(new Set(routes.map((r) => r.year))).sort();

  if (loading) {
    return <div className="p-6 text-center">Loading routes...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Routes</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="vessel-type-filter" className="block text-sm font-medium mb-1">Vessel Type</label>
          <select
            id="vessel-type-filter"
            value={filters.vesselType}
            onChange={(e) => setFilters({ ...filters, vesselType: e.target.value })}
            className="w-full p-2 border rounded"
            aria-label="Vessel Type"
          >
            <option value="">All</option>
            {uniqueVesselTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fuel-type-filter" className="block text-sm font-medium mb-1">Fuel Type</label>
          <select
            id="fuel-type-filter"
            value={filters.fuelType}
            onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
            className="w-full p-2 border rounded"
            aria-label="Fuel Type"
          >
            <option value="">All</option>
            {uniqueFuelTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="year-filter" className="block text-sm font-medium mb-1">Year</label>
          <select
            id="year-filter"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="w-full p-2 border rounded"
            aria-label="Year"
          >
            <option value="">All</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left border">Route ID</th>
              <th className="px-4 py-2 text-left border">Vessel Type</th>
              <th className="px-4 py-2 text-left border">Fuel Type</th>
              <th className="px-4 py-2 text-left border">Year</th>
              <th className="px-4 py-2 text-left border">GHG Intensity (gCO₂e/MJ)</th>
              <th className="px-4 py-2 text-left border">Fuel Consumption (t)</th>
              <th className="px-4 py-2 text-left border">Distance (km)</th>
              <th className="px-4 py-2 text-left border">Total Emissions (t)</th>
              <th className="px-4 py-2 text-left border">Baseline</th>
              <th className="px-4 py-2 text-left border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((route) => (
              <tr key={route.id} className={route.isBaseline ? "bg-yellow-50" : ""}>
                <td className="px-4 py-2 border">{route.routeId}</td>
                <td className="px-4 py-2 border">{route.vesselType}</td>
                <td className="px-4 py-2 border">{route.fuelType}</td>
                <td className="px-4 py-2 border">{route.year}</td>
                <td className="px-4 py-2 border">{route.ghgIntensity.toFixed(2)}</td>
                <td className="px-4 py-2 border">{route.fuelConsumption.toLocaleString()}</td>
                <td className="px-4 py-2 border">{route.distance.toLocaleString()}</td>
                <td className="px-4 py-2 border">{route.totalEmissions.toLocaleString()}</td>
                <td className="px-4 py-2 border text-center">
                  {route.isBaseline ? "✓" : ""}
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleSetBaseline(route.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                    disabled={route.isBaseline}
                  >
                    Set Baseline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRoutes.length === 0 && (
          <div className="p-4 text-center text-gray-500">No routes found</div>
        )}
      </div>
    </div>
  );
}

