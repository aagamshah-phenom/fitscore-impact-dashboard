# Phenom Design System

## Design Philosophy

This application uses a clean, modern enterprise design aesthetic with a focus on clarity, professionalism, and subtle refinement. The design prioritizes usability and visual hierarchy while maintaining a sophisticated, production-ready appearance.

## Color Palette

### Primary Colors

- **Background Colors**

  - App Background: `bg-slate-100` (#F1F5F9)
  - Content Background: `bg-white` (#FFFFFF)
  - Widget Background: `bg-[#F4F6FA]` (Light blue-gray)
  - Card Highlight: `bg-slate-100` (#F1F5F9)
  - Hover State: `bg-slate-100` or `bg-[#E8EAEE]`
- **Text Colors**

  - Primary Heading: `text-[#27282C]` (Near black)
  - Body Text: `text-[#353B46]` (Dark gray)
  - Secondary Text: `text-[#464F5E]` (Medium gray)
  - Muted Text: `text-[#7A818C]` (Light gray)
  - Active Accent: `text-[#7c3aed]` (Purple - used sparingly for active states)
- **Status Colors**

  - Active/Success: Emerald (`emerald-50`, `emerald-500`, `emerald-700`)
  - Warning/On Hold: Amber (`amber-50`, `amber-500`, `amber-700`)
  - Error/Rejected: Red (`red-50`, `red-500`, `red-700`)
  - Info/Hired: Sky (`sky-50`, `sky-500`, `sky-700`)
  - Inactive: Custom gray (`#F4F6FA`, `#8A919E`, `#464F5E`)

### Color Usage Guidelines

- Use purple (`#7c3aed`) ONLY for active navigation states
- Use slate tones for neutral backgrounds and hover states
- Reserve status colors for badges and status indicators
- Maintain high contrast ratios for text readability

## Typography

### Font Family

- **Primary Font**: Poppins (sans-serif)
- **Fallback**: System sans-serif stack
- Font smoothing enabled for crisp rendering

### Font Sizes & Weights

- **Large Headings**: `text-2xl` (24px), `font-semibold` (600)
- **Section Headings**: `text-sm` (14px), `font-semibold` (600)
- **Body Text**: `text-sm` (14px), `font-medium` (500)
- **Button Labels**: `text-sm` (14px), `font-medium` (500)
- **Small Text**: `text-xs` (12px), `font-medium` (500)
- **Badges**: `text-[11px]`, `font-semibold` (600)

### Letter Spacing

- Headers: `tracking-[0.1px]` to `tracking-[0.3px]`
- Buttons: `tracking-[0.2px]`
- Body text: Default tracking

### Line Height

- Headers: `leading-none` or `leading-5`
- Body text: Default leading

## Spacing System

Based on Tailwind's spacing scale:

- **Micro Spacing**: `gap-1` (4px), `gap-1.5` (6px)
- **Small Spacing**: `gap-3` (12px), `gap-4` (16px)
- **Medium Spacing**: `gap-6` (24px)
- **Large Spacing**: `gap-8` (32px)
- **Padding Small**: `p-3` (12px), `p-5` (20px)
- **Padding Large**: `p-8` (32px), `p-10` (40px)

### Component Spacing

- Page content: `p-8 px-10` (32px vertical, 40px horizontal)
- Widget padding: `p-5` (20px)
- Button padding: `px-4 py-2.5` or `px-2.5 py-1`
- Badge padding: `px-2.5 py-1`

## Border Radius

Consistent rounded corners create a modern, friendly feel:

- **Large Radius**: `rounded-2xl` (16px) - Main content area, widgets
- **Medium Radius**: `rounded-[10px]` (10px) - Buttons, nav items, interactive elements
- **Small Radius**: `rounded-lg` (8px) - Badges, small elements
- **Circular**: `rounded-full` - Status dots, avatars

## Layout & Shell Structure

### Application Shell

```
┌─────────────────────────────────────────────┐
│ TopNav (h-16)                               │
├──────┬──────────────────────────────────────┤
│      │                                      │
│ Side │  Main Content (rounded-2xl)         │
│ bar  │                                      │
│      │                                      │
└──────┴──────────────────────────────────────┘
```

### Root Layout

- **Container**: `flex flex-col h-screen bg-slate-100`
- **TopNav**: Fixed height `h-16`, full width
- **Body Container**: `flex flex-1 pr-3 pb-3 min-h-0`
  - Creates 12px padding on right and bottom
  - `min-h-0` prevents overflow issues
- **Sidebar**: Collapsible, `w-16` collapsed, `w-52` expanded
- **Main Content**: `flex-1 bg-white rounded-2xl min-h-0 overflow-hidden`

### Page Layout Pattern

All pages should follow this structure:

```jsx
export default function PageName() {
  return (
    <div className="flex flex-col gap-8 p-8 px-10 overflow-y-auto h-full">
      {/* Page Header */}
      <PageHeader />

      {/* Page Content */}
      <div className="flex flex-col gap-6">
        {/* Content sections */}
      </div>
    </div>
  );
}
```

- Outer container: `flex flex-col gap-8 p-8 px-10 overflow-y-auto h-full`
- Content wrapper: `flex flex-col gap-6`
- Sections use 24px gap between them

## Component Patterns

### Navigation Items (Sidebar)

```jsx
<button
  className={`flex items-center gap-3 h-10 rounded-[10px] transition-colors w-full ${
    expanded ? 'px-3' : 'justify-center'
  } ${
    isActive
      ? 'bg-slate-200 text-[#7c3aed]'
      : 'text-[#353B46] hover:bg-slate-100'
  }`}
>
  <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
  {expanded && <span className="text-sm font-medium truncate">{label}</span>}
</button>
```

**Key Features:**

- Height: `h-10` (40px)
- Border radius: `rounded-[10px]`
- Icon size: `w-4 h-4` (16px)
- Active state: `bg-slate-200 text-[#7c3aed]`
- Hover: `hover:bg-slate-100`
- Transition: `transition-colors`

### Icon Buttons (TopNav)

```jsx
<button className="flex items-center justify-center w-10 h-10 rounded-[10px] hover:bg-[#E8EAEE] transition-colors">
  <Icon className="w-[18px] h-[18px] text-[#353B46]" strokeWidth={2} />
</button>
```

**Key Features:**

- Size: `w-10 h-10` (40x40px)
- Icon: `w-[18px] h-[18px]`
- Hover: `hover:bg-[#E8EAEE]`
- Stroke width: `strokeWidth={2}`

### Widget Shell

```jsx
<div className="flex flex-col p-5 gap-4 rounded-2xl bg-[#F4F6FA]">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-semibold tracking-[0.1px] text-[#27282C]">
      {title}
    </h3>
    <button className="text-xs font-medium tracking-[0.2px] text-[#464F5E] hover:text-[#27282C]">
      {action}
    </button>
  </div>
  {children}
</div>
```

**Key Features:**

- Background: `bg-[#F4F6FA]`
- Border radius: `rounded-2xl`
- Padding: `p-5` (20px)
- Header with title and action button
- Inner spacing: `gap-4`

### Tab Navigation

```jsx
<button
  className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-100 text-[#27282C]'
      : 'text-[#7A818C] hover:bg-slate-100'
  }`}
>
  {label}
</button>
```

**Key Features:**

- Padding: `px-4 py-2`
- Border radius: `rounded-[10px]`
- Active: `bg-slate-100 text-[#27282C]`
- Inactive: `text-[#7A818C]`

### Status Badges

```jsx
<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${bg} ${text}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
  {label}
</span>
```

**Key Features:**

- Font: `text-[11px] font-semibold`
- Padding: `px-2.5 py-1`
- Border radius: `rounded-lg`
- Status dot: `w-1.5 h-1.5 rounded-full`
- Color-coded backgrounds and text

### Sub-Navigation (Hierarchical Sidebar)

The sidebar supports hierarchical navigation with collapsible sections. When expanded, sections show with headers and nested items. When collapsed, hovering shows flyout menus.

**Section Header (Expanded State):**

```jsx
<button
  onClick={() => toggleSection(key)}
  className="w-full flex items-center justify-between px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7A818C] hover:text-[#464F5E] transition-colors"
>
  <span>{label}</span>
  {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
</button>
```

**Section Item (Expanded State):**

```jsx
<div className="px-3">
  <button
    className={`flex items-center gap-3 h-9 rounded-[10px] transition-colors w-full px-3 ${
      isActive
        ? 'bg-slate-200 text-[#7c3aed]'
        : 'text-[#353B46] hover:bg-slate-100'
    }`}
  >
    <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
    <span className="text-sm font-medium truncate">{label}</span>
  </button>
</div>
```

**Section Icon (Collapsed State):**

```jsx
<button
  className={`flex items-center justify-center w-9 h-9 rounded-[10px] transition-colors ${
    sectionHasActive || isHovered
      ? 'bg-slate-200 text-[#7c3aed]'
      : 'text-[#353B46] hover:bg-slate-100'
  }`}
>
  <section.Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
</button>
```

**Flyout Menu (Collapsed State):**

```jsx
<div className="bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 min-w-[180px]">
  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7A818C]">
    {section.label}
  </div>
  {section.items.map(item => (
    <button
      className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-slate-200 text-[#7c3aed]'
          : 'text-[#353B46] hover:bg-slate-50'
      }`}
    >
      <item.Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
      <span>{item.label}</span>
    </button>
  ))}
</div>
```

**Key Features:**

- Section headers: `text-[11px] font-semibold uppercase tracking-wider`
- Section icons: `w-9 h-9` (36x36px)
- Section items: `h-9` (36px height)
- Flyout: `rounded-xl shadow-lg border border-slate-200`
- Flyout positioning: Uses `getBoundingClientRect()` for dynamic placement
- Debounced hover: 150ms delay before closing flyout
- Active section indicator: Shows purple when any item in section is active

## Icon Guidelines

### Icon Library

Use **Lucide React** exclusively for all icons.

### Icon Sizing

- Sidebar icons: `w-4 h-4` (16px)
- TopNav icons: `w-[18px] h-[18px]` (18px)
- Dropdown icons: `w-4 h-4` (16px)
- Status indicators: `w-1.5 h-1.5` (6px dots)

### Icon Stroke

- Standard stroke width: `strokeWidth={2}`
- Use `shrink-0` to prevent icons from squishing

## Interactive States

### Hover States

- Buttons: `hover:bg-[#E8EAEE]` or `hover:bg-slate-100`
- Text buttons: `hover:text-[#27282C]`
- Navigation: `hover:bg-slate-100`

### Active States

- Sidebar: `bg-slate-200 text-[#7c3aed]`
- Tabs: `bg-slate-100 text-[#27282C]`

### Transitions

- All interactive elements: `transition-colors`
- Sidebar expand/collapse: `transition-all duration-200`
- Icon rotations: `transition-transform duration-200`

## Adding New Pages

### Step-by-Step Guide

1. **Create the page component** in `src/pages/`

```jsx
export default function NewPage() {
  return (
    <div className="flex flex-col gap-8 p-8 px-10 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-[0.3px] text-[#27282C]">
          Page Title
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Content sections */}
      </div>
    </div>
  );
}
```

2. **Add navigation item to a section** in `Sidebar.tsx`

```jsx
const navSections: NavSection[] = [
  {
    label: 'Your Section',
    key: 'your-section',
    Icon: SectionIcon,
    items: [
      { label: 'New Page', key: 'newpage', Icon: YourIcon },
    ],
  },
];
```

Or add to an existing section:

```jsx
{
  label: 'Recruiting',
  key: 'recruiting',
  Icon: UserCheck,
  items: [
    { label: 'Candidates', key: 'candidates', Icon: UserCheck },
    { label: 'Pipeline', key: 'pipeline', Icon: Network },
    { label: 'New Page', key: 'newpage', Icon: YourIcon },
  ],
},
```

3. **Add default expanded state** (if creating a new section)

```jsx
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
  recruiting: true,
  'your-section': true,
});
```

4. **Add route** in `App.tsx`

```jsx
{activePage === 'newpage' && <NewPage />}
```

### Page Header Pattern

Use consistent page headers:

```jsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold tracking-[0.3px] text-[#27282C]">
      Page Title
    </h1>
    <p className="text-sm text-[#464F5E] mt-1">Optional subtitle</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Action buttons */}
  </div>
</div>
```

## Grid Layouts

### Two-Column Layout

```jsx
<div className="flex gap-6">
  <div className="flex flex-col gap-6 flex-[2] min-w-0">
    {/* Main content - 2/3 width */}
  </div>
  <div className="flex flex-col gap-6 w-[560px] shrink-0">
    {/* Sidebar content - fixed width */}
  </div>
</div>
```

### Card Grid

```jsx
<div className="grid grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

## React Flow Diagrams (Workflow Canvas)

### Overview

Use React Flow for creating visual workflow diagrams, process flows, and canvas-based editors.

### Dependencies

Required packages:

```json
{
  "reactflow": "^11.11.4",
  "@dagrejs/dagre": "^2.0.4"
}
```

Import React Flow CSS in your component:

```jsx
import 'reactflow/dist/style.css';
```

### Page Structure

Workflow pages follow this structure:

```jsx
export default function WorkflowPage() {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(workflowNodes, workflowEdges),
    []
  );

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  return (
    <div className="flex flex-col h-full">
      <div className="px-10 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-[#27282C] tracking-tight">
          Workflow Title
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Workflow description
        </p>
      </div>

      <div className="flex-1 mx-6 mb-6 rounded-2xl overflow-hidden border border-gray-100 bg-[#FAFBFC]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable
          nodesConnectable={false}
        >
          <Background color="#e2e8f0" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!rounded-xl !border-gray-200 !shadow-sm"
          />
          <MiniMap
            nodeColor="#cbd5e1"
            maskColor="rgba(255,255,255,0.7)"
            className="!rounded-xl !border-gray-200 !shadow-sm"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </div>
  );
}
```

### Canvas Configuration

**Container Styling:**

- Container: `flex-1 mx-6 mb-6 rounded-2xl overflow-hidden border border-gray-100 bg-[#FAFBFC]`
- Background color: `#FAFBFC` (light gray-blue)
- Border: `border-gray-100`
- Rounded corners: `rounded-2xl`

**ReactFlow Props:**

```jsx
<ReactFlow
  fitView
  fitViewOptions={{ padding: 0.25 }}
  proOptions={{ hideAttribution: true }}
  minZoom={0.2}
  maxZoom={1.5}
  nodesDraggable
  nodesConnectable={false}
>
```

**Background:**

```jsx
<Background color="#e2e8f0" gap={20} size={1} />
```

**Controls:**

```jsx
<Controls
  showInteractive={false}
  className="!rounded-xl !border-gray-200 !shadow-sm"
/>
```

**MiniMap:**

```jsx
<MiniMap
  nodeColor="#cbd5e1"
  maskColor="rgba(255,255,255,0.7)"
  className="!rounded-xl !border-gray-200 !shadow-sm"
  pannable
  zoomable
/>
```

### Node Component

Create a custom node component using this pattern:

```jsx
import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

function WorkflowNode({ data }: NodeProps) {
  const Icon = iconMap[data.icon];

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-gray-300 !border-0 !-top-1"
      />

      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100/80 px-4 py-3.5 flex items-center gap-3.5 min-w-[260px] max-w-[280px] hover:shadow-md transition-all duration-200 cursor-default"
        style={{ borderLeftColor: data.color, borderLeftWidth: 3 }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${data.color}14` }}
        >
          <Icon
            className="w-[18px] h-[18px]"
            style={{ color: data.color }}
            strokeWidth={1.8}
          />
        </div>

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-[13px] font-semibold text-[#27282C] leading-tight truncate">
            {data.label}
          </span>
          <span className="text-[11px] text-[#9CA3AF] leading-tight truncate">
            {data.description}
          </span>
        </div>

        {data.count !== undefined && (
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: `${data.color}14`, color: data.color }}
          >
            {data.count}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-gray-300 !border-0 !-bottom-1"
      />
    </>
  );
}

export default memo(WorkflowNode);
```

**Node Styling Key Features:**

- Background: `bg-white`
- Border radius: `rounded-xl`
- Border: `border border-gray-100/80`
- Left accent border: 3px colored border (`borderLeftWidth: 3`)
- Width: `min-w-[260px] max-w-[280px]`
- Padding: `px-4 py-3.5`
- Hover effect: `hover:shadow-md transition-all duration-200`
- Icon container: `w-9 h-9 rounded-lg` with 10% opacity color background
- Icon size: `w-[18px] h-[18px]` with `strokeWidth={1.8}`
- Label: `text-[13px] font-semibold text-[#27282C]`
- Description: `text-[11px] text-[#9CA3AF]`
- Badge: `text-[11px] font-bold` with colored background

**Handle Styling:**

- Size: `!w-2 !h-2` (8x8px)
- Color: `!bg-gray-300`
- No border: `!border-0`
- Position: `!-top-1` and `!-bottom-1`

### Node Data Structure

Define nodes with this structure:

```typescript
const workflowNodes: Node[] = [
  {
    id: 'unique-id',
    type: 'workflowNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'Node Title',
      description: 'Brief description',
      icon: 'iconName',
      color: '#0ea5e9',
      count: 42,
    },
  },
];
```

### Edge Styling

Create edges using this helper pattern:

```typescript
import { type Edge, MarkerType } from 'reactflow';

function edge(
  id: string,
  source: string,
  target: string,
  color: string,
  opts: Partial<Edge> = {}
): Edge {
  return {
    id,
    source,
    target,
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: color,
      strokeWidth: 1.5,
      ...opts.style
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color,
      width: 14,
      height: 14,
    },
    ...opts,
  };
}

const workflowEdges: Edge[] = [
  edge('e1', 'node1', 'node2', '#94a3b8'),

  edge('e2', 'node2', 'node3', '#f59e0b', {
    style: { strokeDasharray: '6 4' },
    label: 'Optional',
    labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 500 },
    labelBgStyle: { fill: '#FAFBFC', fillOpacity: 0.9 },
  }),
];
```

**Edge Properties:**

- Type: `smoothstep` for curved edges
- Animated: `true` for flowing dots
- Stroke width: `1.5`
- Arrow marker: `MarkerType.ArrowClosed` with `width: 14, height: 14`
- Dashed style: `strokeDasharray: '6 4'` for optional/conditional paths
- Labels: Use `label`, `labelStyle`, and `labelBgStyle` for annotations

### Dagre Auto-Layout

Use Dagre for automatic node positioning:

```typescript
import Dagre from '@dagrejs/dagre';
import { type Node, type Edge } from 'reactflow';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 80;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 90,
    edgesep: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

**Layout Configuration:**

- Direction: `TB` (vertical) or `LR` (horizontal)
- Node separation: `80px` horizontal spacing
- Rank separation: `90px` vertical spacing between levels
- Edge separation: `40px` spacing between parallel edges
- Node dimensions: `280x80px`

### Workflow Color Palette

Use semantic colors to indicate workflow stages:

| Stage | Color | Hex | Usage |
|---|---|---|---|
| **Initial/Intake** | Sky | `#0ea5e9` | Start of process, data collection |
| **Processing** | Teal | `#14b8a6` | Active processing, review stages |
| **Evaluation** | Amber | `#f59e0b` | Assessment, decision points |
| **Critical** | Orange | `#f97316` | Important stages requiring attention |
| **Neutral** | Slate | `#64748b` | Standard operations, no special status |
| **Success** | Green | `#10b981` | Positive outcomes, approvals |
| **Complete** | Emerald | `#059669` | Final success state |
| **Error/Reject** | Red | `#ef4444` | Failures, rejections |

**Edge Colors:**

- Default path: `#94a3b8` (slate-400)
- Success path: `#10b981` (green-500)
- Error path: `#ef4444` (red-500)
- Conditional: Match source node color
- Optional: Use `strokeDasharray: '6 4'`

### Icon Integration

Map Lucide icons to workflow nodes:

```typescript
import {
  Inbox,
  ScanSearch,
  UserCheck,
  Phone,
  Code2,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  inbox: Inbox,
  scan: ScanSearch,
  userCheck: UserCheck,
  phone: Phone,
  code: Code2,
};
```

**Common Workflow Icons:**

- Inbox: Start/intake
- ScanSearch: Automated review
- UserCheck: Manual review
- Phone: Communication
- Code2: Technical work
- ClipboardList: Documentation
- Users: Group activities
- ShieldCheck: Verification
- Send: Notifications/output
- XCircle: Rejection
- Handshake: Agreement
- Rocket: Launch/completion

### Best Practices for Workflows

**Do:**

- Use semantic colors consistently across similar workflow types
- Keep node labels concise (2-4 words)
- Include descriptive subtitles
- Use badges for counts/metrics
- Animate edges for better flow visualization
- Use dashed edges for optional/conditional paths
- Add edge labels for decision points
- Export `layoutUtils.ts` for reuse
- Memo-ize custom node components
- Use `useMemo` for layout calculations

**Don't:**

- Mix color schemes arbitrarily
- Create nodes wider than 280px
- Use more than 2 lines of text in nodes
- Overcrowd the canvas (use pagination/filtering)
- Create deeply nested workflows (max 10-12 levels)
- Use solid edges for optional paths
- Omit descriptions on nodes
- Forget to handle empty states

**Performance:**

- Use `memo()` on custom node components
- Minimize re-renders with `useMemo` for layout
- Avoid inline styles where possible (use Tailwind classes)
- Limit initial node count to <100 for optimal performance

## Best Practices

### Consistency Checklist

- Use `rounded-2xl` for major containers and widgets
- Use `rounded-[10px]` for buttons and interactive elements
- Maintain 24px (`gap-6`) spacing between major sections
- Use page padding of `p-8 px-10` consistently
- Apply `transition-colors` to all interactive elements
- Use Lucide React icons with `strokeWidth={2}`
- Follow the established color palette strictly
- Use purple (`#7c3aed`) ONLY for active navigation states
- Include `shrink-0` on icons to prevent squishing
- Use `min-w-0` on flex children that may overflow
- Add `overflow-y-auto h-full` to scrollable containers

### Typography Best Practices

- Use `font-semibold` for headings
- Use `font-medium` for body text and buttons
- Add subtle letter spacing to text: `tracking-[0.1px]` - `tracking-[0.3px]`
- Use `truncate` for text that may overflow

### Spacing Best Practices

- Use 8px (`gap-2`) for tight groupings
- Use 16px (`gap-4`) for related elements
- Use 24px (`gap-6`) for section separation
- Use 32px (`gap-8`) for major page sections

### Accessibility

- Maintain sufficient color contrast for text
- Provide `title` attributes for collapsed sidebar buttons
- Use semantic HTML elements
- Include hover states for all interactive elements
- Ensure focus states are visible

## Component Organization

Keep components organized by purpose:

```
src/
├── components/
│   ├── TopNav.tsx
│   ├── Sidebar.tsx
│   ├── StatusBadge.tsx
│   ├── TabBar.tsx
│   └── [page]/
│       └── Component.tsx
├── pages/
│   └── PageName.tsx
└── data/
    └── mockData.ts
```

## Design Don'ts

- Don't use purple/indigo gradients excessively
- Don't mix border radius sizes inconsistently
- Don't use colors outside the defined palette
- Don't create custom spacing that doesn't follow the system
- Don't use emojis in UI text
- Don't add unnecessary animations or transitions
- Don't nest widgets more than necessary
- Don't create overly complex layouts

## Resources

- **Icons**: [Lucide React](https://lucide.dev/)
- **Font**: Poppins (imported via CDN or self-hosted)
- **CSS Framework**: Tailwind CSS
- **Color Tool**: Use hex values consistently as defined in this guide
