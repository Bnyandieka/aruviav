# Admin Service Management - UI/UX Guide

## 🎨 Admin Dashboard - Services Tab

### Tab Navigation
```
┌─────────────────────────────────────────────────────────┐
│ 📦 Products │ 🛠️ Services │ 🛒 Orders │ 👥 Members │... │
└─────────────────────────────────────────────────────────┘
                        ▲
                    Click here
```

### Stats Cards
```
┌──────────────────────────────────────────────────────────┐
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ ┌──┐ │
│ │Total        │  │Active       │  │Under Review │ │..│ │
│ │Services:    │  │Services:    │  │Services:    │ │  │ │
│ │  -          │  │  -          │  │  -          │ │  │ │
│ └─────────────┘  └─────────────┘  └─────────────┘ │  │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Search & Filter Section
```
┌─────────────────────────────────────────────────────────┐
│ Search Services                                         │
│ [_______________________________________ Search field] │
│                                                         │
│ Filter by Status                                        │
│ [All Statuses ▼] (dropdown)                             │
└─────────────────────────────────────────────────────────┘
```

### Service Table
```
┌──────────────────────────────────────────────────────────────────────┐
│ Service Name │ Seller  │ Price  │ Status  │ Created │ Actions        │
├──────────────────────────────────────────────────────────────────────┤
│ Web Design   │ John D. │KES5000 │ Active  │ Jan 15  │ ✏️ 👁️ 🗑️       │
│ Logo Design  │ Jane S. │KES3000 │ Rejected│ Jan 14  │ ✏️ 👁️ 🗑️       │
│ UI/UX        │ Mike T. │KES7000 │ Review  │ Jan 13  │ ✏️ 👁️ 🗑️       │
│ (deleted)    │ Ann K.  │KES2000 │ Deleted │ Jan 12  │    -    🗑️  |
└──────────────────────────────────────────────────────────────────────┘
```

### Status Badge Styles
```
Active:        ┌────────┐  (Green background, green text)
               │ Active │
               └────────┘

Under Review:  ┌──────────────┐  (Yellow background, yellow text)
               │ Under Review │
               └──────────────┘

Rejected:      ┌──────────┐  (Red background, red text)
               │ Rejected │
               └──────────┘

Deleted:       ┌─────────┐  (Gray background, gray text)
               │ Deleted │
               └─────────┘
```

### Action Buttons
```
Edit Icon (✏️)
├─ Hover: Changes to blue
└─ Click: Opens edit modal

Status Icon (👁️) 
├─ Hover: Shows dropdown
└─ Options:
   ├─ ✓ Approve (Active)
   ├─ ⚠️ Ask for Review
   └─ ✗ Reject

Delete Icon (🗑️)
├─ Hover: Changes to red
├─ Click: Shows confirmation
└─ Confirm: Deletes service
```

---

## ✏️ Edit Service Modal

```
┌─────────────────────────────────────────┐
│ Edit Service                         ✕   │
├─────────────────────────────────────────┤
│                                         │
│ Service Name *                          │
│ [________________________________]      │
│                                         │
│ Description *                           │
│ [________________________________]      │
│ [________________________________]      │
│ [________________________________]      │
│ [________________________________]      │
│                                         │
│ Price (KES) *                           │
│ [________________________________]      │
│                                         │
│ Category *                              │
│ [________________________________]      │
│                                         │
│ Duration Type *                         │
│ [Hourly ▼]  (dropdown)                  │
│   ├─ Hourly                             │
│   ├─ Daily                              │
│   └─ One-time                           │
│                                         │
├─────────────────────────────────────────┤
│ [  Cancel  ] [  Save Changes  ]         │
└─────────────────────────────────────────┘
```

### Status Dropdown Menu
```
┌────────────────────────────┐
│ Approve (Active)        ✓  │  (Green text, if not already active)
├────────────────────────────┤
│ Ask for Review          ⚠️  │  (Yellow text, if not already under review)
├────────────────────────────┤
│ Reject                  ✕  │  (Red text, if not already rejected)
└────────────────────────────┘
```

---

## 📝 Service Details Page - Owner View

### Edit & Delete Buttons
```
┌─────────────────────────────────┐
│ Web Design Service              │
├─────────────────────────────────┤
│ Service Provider                │
│ ┌─────────────────────────────┐ │
│ │         [Profile]           │ │
│ │                             │ │
│ │  John Designer              │ │
│ │                             │ │
│ │  [✏️ Edit Service]           │ │ ← For owner only
│ │  [🗑️ Delete Service]         │ │ ← For owner only
│ │                             │ │
│ │  Phone: +254 700 000 000    │ │
│ │  Email: john@example.com    │ │
│ │  Location: Nairobi, Kenya   │ │
│ │                             │ │
│ │  [📞 Contact Provider]       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Status Warning Banner
```
For Under Review/Rejected Services:

┌────────────────────────────────────────┐
│ ⚠️ This service is under review by     │
│    admin                               │
│                                        │
│ Admin notes: "Please fix spelling in  │
│ description and add more details"     │
└────────────────────────────────────────┘

Or:

┌────────────────────────────────────────┐
│ ❌ This service has been rejected by   │
│    admin                               │
│                                        │
│ Reason: "Violates community           │
│ guidelines - duplicate service"       │
└────────────────────────────────────────┘
```

### Delete Confirmation Dialog
```
┌──────────────────────────────────────┐
│  Confirm Delete                      │
├──────────────────────────────────────┤
│                                      │
│  Are you sure you want to delete    │
│  this service?                       │
│  This action cannot be undone.      │
│                                      │
│  [Cancel]  [Delete]                  │
│              (Red button)            │
│                                      │
└──────────────────────────────────────┘
```

---

## 🎯 Responsive Breakpoints

### Desktop (lg+)
- Full table with all columns
- Dropdown menus for actions
- Edit modal full-width modal

### Tablet (md)
- Stacked cards instead of table
- Smaller buttons/icons
- Touch-friendly spacing

### Mobile (sm)
- Single-column layout
- Vertical button stacks
- Simplified table (name, status, action)

---

## 🎨 Color Scheme

### Status Colors
```
Active:       Green    (#10b981)  - Indicates visible/operational
Under Review: Yellow   (#f59e0b)  - Indicates pending action
Rejected:     Red      (#ef4444)  - Indicates not approved
Deleted:      Gray     (#6b7280)  - Indicates removed
```

### Action Colors
```
Edit:     Blue       (#3b82f6)   - Information/neutral
Approve:  Green      (#22c55e)   - Positive action
Reject:   Red        (#ef4444)   - Destructive action
Delete:   Red        (#dc2626)   - Destructive action
```

### Text Colors
```
Primary:   Dark gray (#1f2937)
Secondary: Medium gray (#6b7280)
Muted:     Light gray (#9ca3af)
```

---

## 🔔 Toast Notifications

### Success
```
┌──────────────────────────────────┐
│ ✓ Service updated successfully   │
└──────────────────────────────────┘
(Green background, auto-dismiss 3s)
```

### Error
```
┌──────────────────────────────────┐
│ ✕ Failed to update service       │
└──────────────────────────────────┘
(Red background, stays visible)
```

### Info
```
┌──────────────────────────────────┐
│ ℹ️ Loading services...            │
└──────────────────────────────────┘
(Blue background, auto-dismiss)
```

---

## ⌨️ Keyboard Interactions

### Tab Navigation
```
Tab    → Next focusable element
Shift+Tab → Previous focusable element
```

### Form Inputs
```
Enter  → Submit form / Trigger action
Esc    → Close modal
```

### Dropdown Menus
```
Click  → Open dropdown
Esc    → Close dropdown
Enter  → Select option
```

---

## 🌍 Accessibility Features

✅ Implemented:
- ARIA labels on buttons
- Keyboard navigation support
- Color not used alone for information
- Sufficient color contrast ratios
- Descriptive button text ("Delete Service" not just "Delete")
- Loading states and spinners
- Focus indicators on interactive elements

---

## 📱 Mobile-Specific Layouts

### Compact Table View
```
┌────────────────────────────┐
│ Web Design                 │
│ Status: Active ✓           │
│ Seller: John D.            │
│ Price: KES 5000            │
├────────────────────────────┤
│ [✏️] [👁️] [🗑️]             │
└────────────────────────────┘

┌────────────────────────────┐
│ Logo Design                │
│ Status: Rejected ✕         │
│ Seller: Jane S.            │
│ Price: KES 3000            │
├────────────────────────────┤
│ [✏️] [👁️] [🗑️]             │
└────────────────────────────┘
```

### Mobile Action Menu
```
Status Menu (if user long-presses eye icon):

┌──────────────────┐
│ Approve       ✓  │
│ Ask for Review ⚠️  │
│ Reject        ✕  │
│ [Cancel]         │
└──────────────────┘
```

---

## 🔄 Loading States

### Fetching Services
```
┌──────────────────────┐
│  Loading services... │
│   [spinning circle]  │
└──────────────────────┘
```

### Saving Changes
```
Button state: [Saving...]  (disabled, grayed out)
```

### Deleting
```
Button state: [Deleting...]  (disabled, spinner)
```

---

## ✨ Empty States

### No Services
```
┌────────────────────────────┐
│                            │
│   No services found        │
│                            │
│   Try adjusting your       │
│   filters or search terms  │
│                            │
│   [Create Service]         │
│                            │
└────────────────────────────┘
```

### No Search Results
```
┌────────────────────────────┐
│                            │
│   No services match your   │
│   search criteria          │
│                            │
│   Searched for: "xyz123"   │
│                            │
│   [Clear Search]           │
│                            │
└────────────────────────────┘
```

---

## 🎭 State Transitions

### Service Status Flow UI
```
ACTIVE
  │
  ├─→ EDIT → ACTIVE (save changes)
  │
  └─→ STATUS DROPDOWN
       ├─→ ASK FOR REVIEW → UNDER_REVIEW
       │    └─→ APPROVE → ACTIVE
       │    └─→ REJECT → REJECTED
       │
       └─→ DELETE → DELETED

UNDER_REVIEW
  │
  ├─→ EDIT → UNDER_REVIEW
  │
  └─→ STATUS DROPDOWN
       ├─→ APPROVE → ACTIVE
       └─→ REJECT → REJECTED

REJECTED
  │
  ├─→ EDIT → REJECTED
  │
  └─→ STATUS DROPDOWN
       └─→ APPROVE → ACTIVE

DELETED
  └─→ No actions available
```

---

## 🎬 Animation/Transitions

### Table Row Hover
```
Default: Normal opacity
Hover:   Slight background color change (light gray)
         All buttons visible
```

### Modal Appearance
```
Fade in: 200ms ease-in
         Backdrop fades in simultaneously
```

### Button Interactions
```
Hover:   Background color darkens
         Cursor changes to pointer
         
Active:  Scale slightly down (98%)
         Visual feedback of click
```

---

This UI guide ensures consistent, user-friendly interfaces across all admin service management features.
