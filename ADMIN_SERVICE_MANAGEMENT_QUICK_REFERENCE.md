# Admin Service Management - Quick Reference

## Admin Dashboard - Services Tab (🛠️)

### Access
- Go to Admin Dashboard
- Click "Services" tab
- All services appear with filters

### Search & Filter
- **Search Box**: Find services by name, description, seller, or ID
- **Status Filter**: Active | Under Review | Rejected | Deleted

### Service Actions

#### 1. Edit (Pencil Icon ✏️)
```
Opens modal to edit:
- Service Name
- Description
- Price
- Category  
- Duration (hourly/daily/one-time)
Changes are saved immediately
Marks as lastEditedByAdmin = true
```

#### 2. Status Change (Eye Icon 👁️)
Click to see dropdown with options:
```
- Approve (Active) → Service visible to public
- Ask for Review → Hides from public, owner sees warning
- Reject → Hides from public, shows admin notes
```

#### 3. Delete (Trash Icon 🗑️)
```
Permanently deletes service
Shows confirmation dialog
Deleted services can still be viewed in "Deleted" filter
Marked as deletedByAdmin = true
```

---

## Service Owner - Service Details Page

### Edit Service
- Button: "Edit Service" (green)
- Link to edit page to update service details

### Delete Service  
- Button: "Delete Service" (red)
- Red color indicates destructive action
- Shows confirmation dialog
- Marked as deletedByOwner = true

### Service Status Indicators
If service is under review or rejected:
- Yellow warning banner appears
- Shows reason (admin notes)
- Owner can still see and edit service

---

## Service Status Meanings

| Status | Visibility | Used For |
|--------|-----------|----------|
| **active** | Everyone | Normal service visibility |
| **under_review** | Owner + Admin only | Asking owner to make changes |
| **rejected** | Owner + Admin only | Service doesn't meet criteria |
| **deleted** | None | Permanently removed |

---

## Database Fields

### New Service Document Fields
```javascript
{
  status: 'active' | 'under_review' | 'rejected' | 'deleted',
  adminNotes: 'Reason for status change',
  lastEditedByAdmin: true/false,
  deletedByAdmin: true/false,
  deletedByOwner: true/false,
  reviewRequestedAt: timestamp,
  deletedAt: timestamp
}
```

---

## Common Tasks

### Task 1: Ask Service Owner to Fix Spelling
1. Go to Services tab in Admin Dashboard
2. Find the service
3. Click pencil (edit) icon
4. Fix spelling errors
5. Save changes
6. Click status dropdown → "Ask for Review"
7. Owner gets hidden service with notification

### Task 2: Reject a Service
1. Find service in Services tab
2. Click status dropdown (eye icon)
3. Select "Reject"
4. *(In future: Add notes)*
5. Service is hidden from public

### Task 3: Remove Inappropriate Service
1. Find service
2. Click delete icon (trash)
3. Confirm deletion
4. Service is gone from public view

### Task 4: Owner Deletes Own Service
1. Owner views their service detail page
2. Clicks "Delete Service" button
3. Confirms deletion
4. Service is deleted

### Task 5: Re-approve a Service
1. Filter by status: "Under Review" or "Rejected"
2. Click status dropdown
3. Select "Approve (Active)"
4. Service is now visible to public

---

## Tips & Best Practices

✅ **DO**
- Use "Ask for Review" status for minor issues
- Add notes when rejecting (admin notes field)
- Review services regularly
- Test with different user roles

❌ **DON'T**  
- Delete services without checking first
- Forget to add notes for rejections
- Make edit changes without reason
- Leave services in "under review" forever

---

## Troubleshooting

**Q: Service doesn't appear in Services tab?**
- A: Service might be very new (refresh page) or deleted

**Q: Owner can't see their service?**
- A: Service status might be "deleted" - restore from Firestore

**Q: Changes not saving?**
- A: Check network connection, look for error toast

**Q: Can't delete a service?**
- A: Check if already deleted, refresh and try again

---

## Keyboard Shortcuts (Future)
*Not yet implemented*
- `E` = Edit selected service
- `D` = Delete selected service  
- `S` = Search focus
- `/` = Filter focus

---

## Related Documentation
- `ADMIN_SERVICE_MANAGEMENT.md` - Full feature documentation
- Admin Dashboard docs
- Service details page docs
