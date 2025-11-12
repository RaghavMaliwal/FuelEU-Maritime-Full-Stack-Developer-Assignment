# AI Agent Workflow Log

## Agents Used

- **Cursor Agent** (Primary): Used for code generation, refactoring, and architectural decisions
- **GitHub Copilot** (Secondary): Used for inline code completions and boilerplate generation

## Prompts & Outputs

### Example 1: Backend Hexagonal Architecture Setup

**Prompt:**
"Set up the backend with hexagonal architecture following the assignment requirements. Create the folder structure with core, adapters, and infrastructure layers."

**Generated Output:**
- Created proper folder structure: `src/core/domain/`, `src/core/application/`, `src/core/ports/`
- Created adapter layers: `src/adapters/inbound/http/`, `src/adapters/outbound/postgres/`
- Set up Prisma schema with all required tables

**Validation:**
- Verified that core layer has no framework dependencies (no Express, no Prisma imports)
- Confirmed ports define interfaces without implementations
- Checked that adapters implement ports correctly

### Example 2: Compliance Balance Calculation

**Prompt:**
"Implement the ComplianceService with CB calculation using the formula: CB = (Target - Actual) × Energy in scope, where Energy = fuelConsumption × 41,000 MJ/t"

**Generated Output:**
```typescript
private computeCBForRoute(actualGhgIntensity: number, fuelConsumptionTons: number): number {
  const energy = this.energyInScopeMj(fuelConsumptionTons);
  return (TARGET_INTENSITY_2025 - actualGhgIntensity) * energy;
}
```

**Validation:**
- Verified formula matches assignment specification
- Tested with sample data: (89.3368 - 91.0) × (5000 × 41000) = -340,956,000
- Confirmed correct sign (negative for deficit, positive for surplus)

### Example 3: Pooling Allocation Algorithm

**Prompt:**
"Implement greedy allocation algorithm for pooling that sorts surplus descending, deficits ascending, and enforces business rules: deficit ships cannot exit worse, surplus ships cannot exit negative."

**Generated Output:**
- Implemented sorting logic for surplus and deficits
- Created transfer mechanism with proper validation
- Added enforcement checks for business rules

**Correction Needed:**
- Initial implementation had a bug where it didn't properly handle partial allocations
- Fixed by ensuring `sIdx` only increments when surplus is fully depleted
- Added explicit validation checks after allocation

### Example 4: Frontend React Components

**Prompt:**
"Create React components for the four tabs (Routes, Compare, Banking, Pooling) using TailwindCSS, following hexagonal architecture with use cases."

**Generated Output:**
- Created all four tab components with proper state management
- Implemented API client adapter using Axios
- Set up use case classes following hexagonal pattern

**Refinement:**
- Added error handling and loading states
- Improved UI with proper spacing and responsive design
- Added validation for user inputs (e.g., positive amounts, valid pool sums)

### Example 5: Integration Tests with Supertest

**Prompt:**
"Create integration tests for all HTTP endpoints using Supertest, testing the full request/response cycle."

**Generated Output:**
- Created comprehensive integration test suite
- Set up test database cleanup in beforeEach
- Added tests for all endpoints with various scenarios

**Validation:**
- Fixed Jest configuration for ES modules (added moduleNameMapper)
- Corrected test expectations to match actual API behavior
- Added edge case tests (negative CB, invalid pools, etc.)

## Validation / Corrections

### Backend Tests
- **Issue**: Jest couldn't resolve `.js` extensions in imports
- **Fix**: Added `moduleNameMapper` to Jest config to strip `.js` extensions
- **Result**: All 52 tests passing

### Comparison Endpoint
- **Issue**: Compliance check was comparing against baseline instead of target (89.3368)
- **Fix**: Changed `compliant = r.ghgIntensity <= baseGhg` to `compliant = r.ghgIntensity <= TARGET_INTENSITY_2025`
- **Result**: Correct compliance checking against Fuel EU target

### Banking Service
- **Issue**: Test expected error when amount exceeds banked, but business logic should apply maximum available
- **Fix**: Changed logic to apply `Math.min(amount, banked)` instead of throwing error
- **Result**: More user-friendly behavior, tests updated accordingly

### Pooling Tests
- **Issue**: Test cases had invalid pool sums (negative totals)
- **Fix**: Updated test data to have valid sums (>= 0) while still testing edge cases
- **Result**: Tests now properly validate business rules

## Observations

### Where Agent Saved Time
1. **Boilerplate Generation**: Generated entire folder structures, package.json files, and configuration files instantly
2. **Type Definitions**: Created comprehensive TypeScript types matching backend API responses
3. **Test Structure**: Generated test skeletons with proper setup/teardown patterns
4. **Component Templates**: Created React component structure with hooks and state management
5. **API Client**: Generated complete Axios-based API client with all endpoints in minutes

### Where It Failed or Hallucinated
1. **Jest ES Module Configuration**: Initial Jest config didn't handle `.js` extensions properly - required manual fix
2. **Test Expectations**: Some tests had incorrect expectations (e.g., expecting errors when behavior should be graceful)
3. **Pool Validation Logic**: Initial pooling test cases violated business rules (negative sums) - needed manual correction
4. **Import Paths**: Sometimes generated incorrect relative import paths requiring adjustment

### How Tools Were Combined Effectively
1. **Cursor Agent for Architecture**: Used for high-level structure and complex logic
2. **Copilot for Boilerplate**: Used inline completions for repetitive code (test cases, component props)
3. **Manual Review for Business Logic**: Critical formulas and business rules were manually verified
4. **Iterative Refinement**: Used agent to generate initial code, then refined based on test failures

## Best Practices Followed

1. **Hexagonal Architecture**: Strictly maintained separation between core (domain/use cases) and adapters (infrastructure/UI)
   - Core has zero framework dependencies
   - Ports define contracts, adapters implement them

2. **Test-Driven Development**: 
   - Created unit tests for all services first
   - Added integration tests after endpoints were working
   - Fixed bugs revealed by tests

3. **Type Safety**: 
   - Used TypeScript strict mode throughout
   - Defined domain types in core layer
   - Ensured type consistency between frontend and backend

4. **Error Handling**: 
   - Proper try-catch blocks in all async operations
   - User-friendly error messages in UI
   - Validation at both API and UI layers

5. **Code Organization**:
   - Used Cursor's file structure suggestions
   - Followed consistent naming conventions
   - Maintained clear separation of concerns

6. **Documentation in Code**:
   - Added JSDoc comments for complex functions
   - Inline comments for business logic formulas
   - Clear variable names that explain intent



