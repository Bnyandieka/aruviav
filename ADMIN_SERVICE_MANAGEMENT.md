# Admin Service Management Feature - Implementation Summary

## Overview
Added comprehensive admin features to manage services posted by users. Admins can now request reviews, edit services, and delete them. Service owners can also delete their own services.

## Features Implemented

### 1. **Service Status System**
- `active`: Service is visible to public
- `under_review`: Service is hidden from public but visible to owner and admin
- `rejected`: Service is marked as rejected with admin notes
- `deleted`: Service is permanently deleted (soft delete, not visible anywhere)

### 2. **Admin Features**

#### a) Ask for Review
- Admin can request review of a service
- Temporarily hides the service from public view
- Service owner and admin can still see the service
- Service moves to `under_review` status

#### b) Edit Services
- Admin can correct minor errors (spelling, punctuation, etc.)
- Can edit: name, description, price, category, duration
- Changes are tracked with `lastEditedByAdmin` flag
- Preserves all other service data

#### c) Delete Services
- Admin can permanently delete services
- Service is marked with `deletedByAdmin: true`
- Service is hidden from all views
- Cannot be recovered

#### d) View All Services
- Admin dashboard has new "Services" tab (🛠️)
- Shows all services including hidden/under review/rejected
- Filter by status (Active, Under Review, Rejected, Deleted)
- Search by name, description, seller, or ID
- Real-time status updates

### 3. **Owner Features**

#### Delete Service
- Service owners can delete their own services
- Service is marked with `deletedByOwner: true`
- Delete button appears only to the service owner
- Confirmation dialog prevents accidental deletion

### 4. **Service Visibility Rules**
- **Active services**: Visible to everyone on public browse
- **Under Review**: Only visible to owner and admin
- **Rejected**: Only visible to owner and admin (with admin notes)
- **Deleted**: Not visible to anyone

## Files Modified/Created

### New Files
- `src/components/admin/Services/AdminServiceManagement.jsx` - Admin service management component

### Modified Files

#### 1. **src/services/firebase/firestoreHelpers.js**
- Added `status: 'active'` field to new services
- Updated `createService()` to include status field
- Updated `getServices()` to filter out deleted services
- Added new functions:
  - `getAllServicesAdmin()` - Get all services for admin
  - `updateServiceStatus()` - Update service status (admin only)
  - `adminEditService()` - Admin edit service
  - `adminDeleteService()` - Admin delete service
  - `ownerDeleteService()` - Owner delete service

#### 2. **src/pages/admin/AdminDashboard.jsx**
- Added import for `AdminServiceManagement` component
- Added "Services" tab (🛠️) to admin dashboard
- Added stats section for services (Active, Under Review, Rejected)
- Added Services tab content that renders `AdminServiceManagement` component

#### 3. **src/pages/ServiceDetailsPage.jsx**
- Added imports for delete functionality
- Enhanced `useEffect` to check service visibility based on status
- Only shows services if:
  - User is owner of under_review/rejected services
  - Service is not deleted
- Added `handleDeleteService()` function for owners
- Added "Delete Service" button for service owners
- Added status badge showing review/rejection status with admin notes

## Data Structure

### Service Document Fields (New/Modified)
```javascript
{
  id: string,
  name: string,
  description: string,
  price: number,
  category: string,
  duration: string, // 'hourly', 'daily', 'one-time'
  sellerId: string,
  sellerName: string,
  sellerEmail: string,
  status: string, // 'active', 'under_review', 'rejected', 'deleted'
  
  // Admin Fields
  adminNotes: string, // Why service is under review/rejected
  lastEditedByAdmin: boolean,
  
  // Deletion Fields
  deletedAt: timestamp,
  deletedByAdmin: boolean,
  deletedByOwner: boolean,
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  reviewRequestedAt: timestamp // When admin requested review
}
```

## User Experience Flow

### Admin Workflow
1. Navigate to Admin Dashboard → Services tab
2. View all services with search and filtering
3. For any service:
   - Click edit icon to correct errors
   - Click eye icon to:
     - Approve (set to Active)
     - Ask for Review (temporarily hide)
     - Reject (hide and send notes)
   - Click delete icon to permanently remove
4. Changes are saved immediately with toast notifications

### Service Owner Workflow
1. View service details page
2. If owner, see "Edit Service" and "Delete Service" buttons
3. Can edit service via Edit page
4. Can delete service (one-click delete with confirmation)
5. If service is under review/rejected:
   - See warning banner with admin notes
   - Can still see service and edit it
   - Cannot delete while under review (optional, can be changed)

### Public User Workflow
- Can only see services with `status: 'active'`
- Cannot see under_review, rejected, or deleted services
- Regular browsing experience unchanged

## Database Queries Optimized

### Service Queries Now Filter
- `getServices()` - Filters out deleted by default
- Services pages don't show deleted/hidden services unless:
  - User is the owner
  - User is admin (admin view)

## Security Considerations

1. **Owner Operations**: Validated via `sellerId` check
2. **Admin Operations**: Would require admin role verification (implement with Firestore rules)
3. **Visibility**: Service status checked before rendering to prevent leakage
4. **Soft Deletes**: Services not permanently removed, can be recovered if needed

## Installation & Setup

No additional dependencies required. Uses existing:
- React Icons (FiTrash2, FiEdit2, etc.)
- Firebase Firestore
- Toast notifications

## Testing Checklist

- [ ] Admin can view all services in Services tab
- [ ] Admin can filter services by status
- [ ] Admin can search services
- [ ] Admin can edit service details
- [ ] Admin can set service status to "Ask for Review"
- [ ] Admin can reject services with notes
- [ ] Admin can approve services
- [ ] Admin can delete services
- [ ] Service status changes update in real-time
- [ ] Service owner can edit their service
- [ ] Service owner can delete their service
- [ ] Under review/rejected services only visible to owner & admin
- [ ] Deleted services are hidden from all views
- [ ] Public users only see active services
- [ ] Toast notifications appear for all actions
- [ ] Error handling works for all operations

## Future Enhancements

1. **Service Approval Workflow**: Automatic moderation on upload
2. **Revision History**: Track all admin edits
3. **Email Notifications**: Notify owners when service status changes
4. **Bulk Actions**: Select multiple services and perform batch actions
5. **Service Analytics**: View service performance metrics
6. **Scheduled Deletions**: Delete services on a schedule
7. **Service Versions**: Keep versions of edited services
8. **Appeal System**: Allow owners to appeal rejections
