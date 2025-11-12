import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoutesTab } from "../RoutesTab.js";
import { RouteUseCases } from "../../../core/application/routeUseCases.js";
import type { Route } from "../../../core/domain/types.js";

describe("RoutesTab", () => {
  let routeUseCases: RouteUseCases;
  let mockFetchAllRoutes: ReturnType<typeof vi.fn>;
  let mockSetBaseline: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetchAllRoutes = vi.fn();
    mockSetBaseline = vi.fn();
    routeUseCases = {
      fetchAllRoutes: mockFetchAllRoutes,
      setBaselineRoute: mockSetBaseline,
      fetchComparison: vi.fn(),
    } as unknown as RouteUseCases;
  });

  it("should render loading state initially", async () => {
    mockFetchAllRoutes.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<RoutesTab routeUseCases={routeUseCases} />);

    expect(screen.getByText("Loading routes...")).toBeInTheDocument();
  });

  it("should display routes table after loading", async () => {
    const mockRoutes: Route[] = [
      {
        id: 1,
        routeId: "R001",
        vesselType: "Container",
        fuelType: "HFO",
        year: 2024,
        ghgIntensity: 91.0,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
        isBaseline: true,
      },
      {
        id: 2,
        routeId: "R002",
        vesselType: "BulkCarrier",
        fuelType: "LNG",
        year: 2024,
        ghgIntensity: 88.0,
        fuelConsumption: 4800,
        distance: 11500,
        totalEmissions: 4200,
        isBaseline: false,
      },
    ];

    mockFetchAllRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab routeUseCases={routeUseCases} />);

    await waitFor(() => {
      expect(screen.getByText("R001")).toBeInTheDocument();
      expect(screen.getByText("R002")).toBeInTheDocument();
    });

    // Use getAllByText and check table cells specifically
    const containerTexts = screen.getAllByText("Container");
    expect(containerTexts.length).toBeGreaterThan(0);
    
    const bulkCarrierTexts = screen.getAllByText("BulkCarrier");
    expect(bulkCarrierTexts.length).toBeGreaterThan(0);
  });

  it("should call setBaseline when Set Baseline button is clicked", async () => {
    const mockRoutes: Route[] = [
      {
        id: 1,
        routeId: "R001",
        vesselType: "Container",
        fuelType: "HFO",
        year: 2024,
        ghgIntensity: 91.0,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
        isBaseline: false,
      },
    ];

    // Mock initial load and reload after setBaseline
    mockFetchAllRoutes
      .mockResolvedValueOnce(mockRoutes) // Initial load
      .mockResolvedValueOnce(mockRoutes); // Reload after setBaseline
    mockSetBaseline.mockResolvedValue(undefined);

    render(<RoutesTab routeUseCases={routeUseCases} />);

    await waitFor(() => {
      expect(screen.getByText("R001")).toBeInTheDocument();
    });

    const setBaselineButtons = screen.getAllByText("Set Baseline");
    const enabledButton = setBaselineButtons.find(btn => !btn.hasAttribute('disabled'));
    expect(enabledButton).toBeDefined();
    
    if (enabledButton) {
      await userEvent.click(enabledButton);
    }

    await waitFor(() => {
      expect(mockSetBaseline).toHaveBeenCalledWith(1);
    }, { timeout: 3000 });
  });

  it("should filter routes by vessel type", async () => {
    const mockRoutes: Route[] = [
      {
        id: 1,
        routeId: "R001",
        vesselType: "Container",
        fuelType: "HFO",
        year: 2024,
        ghgIntensity: 91.0,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
        isBaseline: false,
      },
      {
        id: 2,
        routeId: "R002",
        vesselType: "BulkCarrier",
        fuelType: "LNG",
        year: 2024,
        ghgIntensity: 88.0,
        fuelConsumption: 4800,
        distance: 11500,
        totalEmissions: 4200,
        isBaseline: false,
      },
    ];

    mockFetchAllRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab routeUseCases={routeUseCases} />);

    await waitFor(() => {
      expect(screen.getByText("R001")).toBeInTheDocument();
    });

    // Use getByRole to find the select by its accessible name
    const vesselTypeSelect = screen.getByRole("combobox", { name: /vessel type/i });
    await userEvent.selectOptions(vesselTypeSelect, "Container");

    await waitFor(() => {
      expect(screen.getByText("R001")).toBeInTheDocument();
      expect(screen.queryByText("R002")).not.toBeInTheDocument();
    });
  });

  it("should display error message on fetch failure", async () => {
    mockFetchAllRoutes.mockRejectedValue(new Error("Failed to fetch routes"));

    render(<RoutesTab routeUseCases={routeUseCases} />);

    await waitFor(() => {
      // The component shows the error message from err.message
      expect(screen.getByText("Failed to fetch routes")).toBeInTheDocument();
    });
  });
});

