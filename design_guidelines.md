# Network Switch Configuration Manager - Design Guidelines

## Design Approach
**Selected System:** Carbon Design System (enterprise data-heavy applications) + Linear (clean technical interface)

**Rationale:** This enterprise network configuration tool demands clarity, precision, and efficiency. Network administrators need confidence in their actions with zero ambiguity. The design will emphasize information hierarchy, clear workflows, and immediate feedback.

## Typography System

**Font Family:** Inter (via Google Fonts CDN)

**Hierarchy:**
- Page Titles: text-2xl font-semibold (32px)
- Section Headers: text-lg font-semibold (20px)
- Card Titles: text-base font-medium (16px)
- Body Text: text-sm (14px)
- Labels/Metadata: text-xs font-medium uppercase tracking-wide (12px)
- Code/Config: JetBrains Mono, text-sm (monospace for configs)

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4, p-6
- Section gaps: gap-4, gap-6
- Page margins: p-6, p-8
- Card spacing: space-y-4

**Grid Structure:**
- Sidebar navigation: 240px fixed width
- Main content: flex-1 with max-w-7xl container
- Configuration panels: Two-column layout (device list + config details)
- Form layouts: Single column, max-w-2xl for focused input

## Component Library

### Navigation
**Sidebar (Fixed Left):**
- Dashboard, Devices, Configurations, History, Settings sections
- Active state: subtle background treatment with border accent
- Icon + label pattern using Heroicons (via CDN)

**Top Bar:**
- Device selector dropdown (current switch context)
- Quick actions (Save Config, Sync, Refresh)
- User profile + notifications

### Core Components

**Device Card:**
- Hostname, IP, model, status indicator
- Quick stats: uplink status, VLAN count, LACP groups
- Action buttons: Configure, View Config, Sync

**Configuration Panel (Multi-tab):**
Tabs: Interfaces, VLANs, LACP, General Settings
- Tab navigation: border-b-2 active state
- Content area: p-6 with form sections

**Interface Configuration Table:**
- Columns: Port, Status, Speed, Mode, VLAN, LACP Group, Actions
- Row hover state for clarity
- Inline editing with immediate visual feedback
- Batch selection for multi-port config

**Form Inputs (Consistent Across App):**
- Labels: text-sm font-medium mb-2 block
- Inputs: p-3 border rounded-lg focus:ring treatment
- Dropdowns: Custom styled selects matching input aesthetic
- Validation: Inline error messages (text-xs text-red-600 mt-1)
- Help text: text-xs mt-1 for guidance

**Config Viewer/Editor:**
- Syntax-highlighted code block (monospace font)
- Line numbers for reference
- Diff view for comparing configs (before/after)
- Copy to clipboard button

**Status Indicators:**
- Online/Offline: Dot indicator (w-2 h-2 rounded-full) + text label
- Port states: Up (green), Down (red), Disabled (gray)
- Sync status: Icon + timestamp of last sync

**Action Buttons:**
- Primary actions: Solid background, medium weight text
- Secondary actions: Border style, ghost background
- Destructive actions: Red accent for delete/reset operations
- Size: px-4 py-2 for standard, px-6 py-3 for prominent CTAs

### Data Display

**Summary Cards (Dashboard):**
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Each card: p-6, border, rounded-lg
- Stat value: text-3xl font-bold
- Label: text-sm
- Trend indicator where applicable

**VLAN Configuration:**
- Table view with VLAN ID, Name, Ports, Status
- Create/Edit modal with form
- Tagged/Untagged port assignment interface (dual-list selector)

**LACP Configuration:**
- Group overview cards
- Member port assignment
- Load balancing method selector
- Active/Passive mode toggle

### Modals & Overlays

**Configuration Modal:**
- Centered, max-w-2xl
- Header with title + close button
- Content: p-6 with form sections
- Footer: Action buttons right-aligned (Cancel + Save)

**Confirmation Dialog:**
- Critical actions (Apply Config, Delete VLAN)
- Clear warning messaging
- Destructive action requires explicit confirmation

## Interaction Patterns

**Config Workflow:**
1. Select device from list/dropdown
2. Navigate to relevant tab (Interfaces/VLANs/LACP)
3. Modify settings in-place or via modal
4. Review changes in diff view
5. Apply with confirmation

**Pull Existing Config:**
- "Import Config" button in top bar
- Device selection + authentication
- Progress indicator during fetch
- Preview + merge options before applying

**Bulk Operations:**
- Checkbox selection on interface table
- Bulk action toolbar appears when items selected
- Apply speed/VLAN/LACP to multiple ports simultaneously

## Visual Hierarchy

**Information Density:**
- Dashboard: High-level overview, scannable cards
- Configuration views: Dense tables with clear row separation
- Detail panels: Focused forms with grouped sections

**Emphasis:**
- Critical status: Bold text + color indicator
- Pending changes: Subtle background highlight on modified rows
- Active selections: Border accent on selected items

## No Images
This application does not require hero images or marketing photography. All visual communication is through interface elements, icons, and data visualization.

**Icons:** Heroicons (outline style for navigation, solid for status indicators)

This design prioritizes clarity, efficiency, and confidence for network administrators managing critical infrastructure.