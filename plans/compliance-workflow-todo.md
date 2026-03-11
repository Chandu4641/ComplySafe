# Compliance Workflow Implementation Plan

## Task List

### Phase 1: Foundation
- [x] **Create workflow layout** - `src/app/(workflow)/layout.tsx`
  - Add progress stepper component
  - Add workflow-specific CSS styles
  - Include step state management
  
- [x] **Create WorkflowStepper component** - `src/components/workflow/WorkflowStepper.tsx`
  - Display 6 workflow stages
  - Show current/completed/pending states
  - Allow navigation to completed steps

### Phase 2: Core Workflow Pages

- [x] **Enhance company signup** - Modify `src/app/onboarding/OnboardingForm.tsx`
  - Add company details form fields
  - Add validation
  - Connect to existing `/api/orgs`

- [x] **Build framework selection page** - `src/app/(workflow)/frameworks/page.tsx`
  - Create framework card components
  - Add enable/disable functionality
  - Show control counts per framework

- [x] **Build integration connection page** - `src/app/(workflow)/integrations/page.tsx`
  - Create integration cards for each provider
  - Add connect/disconnect functionality
  - Show sync status

### Phase 3: Monitoring & Evidence

- [x] **Build control monitoring page** - `src/app/(workflow)/controls/page.tsx`
  - Create control status grid
  - Add health trend visualization
  - Implement control owner assignment

- [x] **Build evidence collection page** - `src/app/(workflow)/evidence/page.tsx`
  - Add drag-and-drop upload
  - Create evidence list with filters
  - Add AI review integration

- [x] **Build compliance readiness dashboard** - `src/app/(workflow)/readiness/page.tsx`
  - Create compliance score widget
  - Add framework breakdown charts
  - Add audit timeline

### Phase 4: Polish

- [x] **Add animations** - Enhance UX with transitions
- [x] **Add validation** - Form validation and error handling
- [x] **Mobile responsive** - Ensure mobile compatibility

---

## File Structure Created/Modified

### New Files
```
src/components/workflow/
├── WorkflowStepper.tsx      # Progress indicator
```

### Modified Files
```
src/app/
├── (workflow)/              # NEW - route group
│   ├── layout.tsx          # NEW
│   ├── frameworks/         # NEW
│   │   └── page.tsx       # NEW
│   ├── integrations/       # NEW
│   │   └── page.tsx       # NEW
│   ├── controls/          # NEW
│   │   └── page.tsx       # NEW
│   ├── evidence/          # NEW
│   │   └── page.tsx       # NEW
│   └── readiness/         # NEW
│       └── page.tsx       # NEW
├── onboarding/
│   └── OnboardingForm.tsx # MODIFY - enhanced
```

---

## Technical Notes

1. **Route Group**: Use `(workflow)` route group for layout isolation
2. **State Management**: Use URL query params for step tracking
3. **API Reuse**: Leverage existing API endpoints without duplication
4. **Styling**: Follow existing CSS patterns in `globals.css`
