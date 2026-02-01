# Admin Service Management - API Reference

## New Functions in firestoreHelpers.js

### 1. `getAllServicesAdmin()`
**Purpose**: Get ALL services including hidden/rejected/deleted (admin only)

**Syntax**:
```javascript
const services = await getAllServicesAdmin();
```

**Returns**:
```javascript
[
  {
    id: string,
    name: string,
    status: string, // 'active', 'under_review', 'rejected', 'deleted'
    sellerId: string,
    sellerName: string,
    price: number,
    createdAt: timestamp,
    ...otherFields
  }
]
```

**Usage**:
```javascript
// In AdminServiceManagement.jsx
const data = await getAllServicesAdmin();
setServices(data);
```

**Security**: Should be called only by admin routes (enforce with Firestore rules)

---

### 2. `updateServiceStatus(serviceId, status, adminNotes)`
**Purpose**: Update service status and optionally add admin notes

**Syntax**:
```javascript
const result = await updateServiceStatus(serviceId, newStatus, optionalNotes);
```

**Parameters**:
- `serviceId` (string): Service ID
- `status` (string): One of `'active'`, `'under_review'`, `'rejected'`, `'deleted'`
- `adminNotes` (string, optional): Notes for owner (why it's under review/rejected)

**Returns**:
```javascript
{
  success: boolean,
  message: string
}
```

**Example**:
```javascript
// Ask for review
await updateServiceStatus(serviceId, 'under_review', 'Please fix spelling in description');

// Reject service
await updateServiceStatus(serviceId, 'rejected', 'Violates community guidelines');

// Approve service
await updateServiceStatus(serviceId, 'active');
```

**Side Effects**:
- Updates `updatedAt` timestamp
- If status is `'under_review'`, sets `reviewRequestedAt` timestamp
- Stores `adminNotes` for later reference

---

### 3. `adminEditService(serviceId, editData)`
**Purpose**: Admin edit service to fix errors (spelling, etc.)

**Syntax**:
```javascript
const result = await adminEditService(serviceId, updateObject);
```

**Parameters**:
- `serviceId` (string): Service ID
- `editData` (object): Fields to update (can be partial)

**Editable Fields**:
```javascript
{
  name: string,
  description: string,
  price: number,
  category: string,
  duration: 'hourly' | 'daily' | 'one-time',
  // Any other service fields
}
```

**Returns**:
```javascript
{
  success: boolean,
  message: string
}
```

**Example**:
```javascript
await adminEditService(serviceId, {
  name: 'Fixed Service Name',
  description: 'Fixed spelling and grammar',
  price: 5000
});
```

**Side Effects**:
- Updates `updatedAt` timestamp
- Sets `lastEditedByAdmin: true` flag
- Keeps audit trail in Firestore

---

### 4. `adminDeleteService(serviceId)`
**Purpose**: Admin permanently delete a service (soft delete)

**Syntax**:
```javascript
const result = await adminDeleteService(serviceId);
```

**Parameters**:
- `serviceId` (string): Service ID

**Returns**:
```javascript
{
  success: boolean,
  message: string
}
```

**Example**:
```javascript
if (window.confirm('Delete this service?')) {
  await adminDeleteService(serviceId);
  toast.success('Service deleted');
}
```

**Side Effects**:
- Sets `status: 'deleted'`
- Sets `deletedByAdmin: true`
- Sets `deletedAt: timestamp`
- Service becomes invisible to everyone

**Notes**: Service is NOT physically deleted from Firestore (soft delete)
Can be recovered by changing status back if needed

---

### 5. `ownerDeleteService(serviceId, sellerId)`
**Purpose**: Service owner delete their own service

**Syntax**:
```javascript
const result = await ownerDeleteService(serviceId, userId);
```

**Parameters**:
- `serviceId` (string): Service ID  
- `sellerId` (string): Current user ID (for verification)

**Returns**:
```javascript
{
  success: boolean,
  message: string
}
```

**Example** (in ServiceDetailsPage.jsx):
```javascript
const handleDeleteService = async () => {
  if (!window.confirm('Delete this service?')) return;
  
  try {
    await ownerDeleteService(id, currentUser.uid);
    toast.success('Service deleted');
    navigate('/services');
  } catch (error) {
    toast.error(error.message);
  }
};
```

**Security**:
- Validates that `sellerId` matches service creator
- Throws error if user doesn't own the service
- Cannot be called by non-owners

**Side Effects**:
- Sets `status: 'deleted'`
- Sets `deletedByOwner: true`
- Sets `deletedAt: timestamp`
- Service becomes invisible to everyone

---

## Modified Functions

### `getServices(limitCount, filters)`
**Changes**:
- Now filters out `status: 'deleted'` services by default
- Public users can only see `status: 'active'` services

**Usage** (unchanged):
```javascript
const services = await getServices();
// Returns only active, non-deleted services
```

---

### `createService(serviceData, userId)`
**Changes**:
- Now automatically sets `status: 'active'` for new services
- New services are immediately visible to public

**Usage** (unchanged):
```javascript
const newService = await createService({
  name: 'Service Name',
  description: 'Description',
  // ...
}, currentUser.uid);
// status: 'active' is added automatically
```

**Data Structure** (new fields):
```javascript
{
  // ...existing fields...
  status: 'active', // NEW
  createdAt: timestamp,
  updatedAt: timestamp,
  rating: 0,
  reviewCount: 0,
  bookings: 0
}
```

---

## Firestore Rules (To Be Implemented)

### Suggested Security Rules
```javascript
match /services/{serviceId} {
  // Read: Public can see active services only
  allow read: if resource.data.status == 'active' ||
              request.auth.uid == resource.data.sellerId ||
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // Write: Only owner can write, admin can write for moderation
  allow write: if request.auth.uid == resource.data.sellerId ||
               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // Create: Any authenticated user
  allow create: if request.auth.uid != null;
  
  // Delete: Physical deletion not allowed (soft delete only)
  allow delete: if false;
}
```

---

## Error Handling

### Common Errors & Solutions

**Error: "Unauthorized: You do not own this service"**
```javascript
// Happens when non-owner tries to delete
try {
  await ownerDeleteService(serviceId, wrongUserId);
} catch (error) {
  // error.message = 'Unauthorized: You do not own this service'
  toast.error(error.message);
}
```

**Error: "Service not found"**
```javascript
// Happens when service ID is invalid
try {
  await ownerDeleteService('invalid-id', userId);
} catch (error) {
  // error.message = 'Service not found'
}
```

---

## Firestore Collection Structure

### Before Implementation
```
/services/{serviceId}
  - name: string
  - description: string
  - sellerId: string
  - price: number
  - category: string
  - rating: number
  - createdAt: timestamp
  - updatedAt: timestamp
```

### After Implementation
```
/services/{serviceId}
  - name: string
  - description: string
  - sellerId: string
  - price: number
  - category: string
  - rating: number
  
  // NEW FIELDS
  - status: 'active' | 'under_review' | 'rejected' | 'deleted'
  - adminNotes: string (optional)
  - lastEditedByAdmin: boolean
  - deletedByAdmin: boolean
  - deletedByOwner: boolean
  
  // TIMESTAMPS
  - createdAt: timestamp
  - updatedAt: timestamp
  - reviewRequestedAt: timestamp (when under_review)
  - deletedAt: timestamp (when deleted)
```

---

## Migration Guide (Existing Services)

For existing services without status field:

### Option 1: Auto-migrate on first fetch
```javascript
const getService = async (serviceId) => {
  const service = await getDoc(doc(db, 'services', serviceId));
  
  if (service.exists()) {
    const data = service.data();
    // If no status, assume active
    if (!data.status) {
      return {
        id: service.id,
        ...data,
        status: 'active' // Default for existing services
      };
    }
    return { id: service.id, ...data };
  }
  return null;
};
```

### Option 2: Batch update all services
```javascript
const migrateServices = async () => {
  const query = query(collection(db, 'services'));
  const snapshot = await getDocs(query);
  
  snapshot.forEach(async (doc) => {
    if (!doc.data().status) {
      await updateDoc(doc.ref, {
        status: 'active',
        updatedAt: serverTimestamp()
      });
    }
  });
};
```

---

## Testing

### Unit Tests
```javascript
// Test updateServiceStatus
test('updateServiceStatus changes status correctly', async () => {
  const result = await updateServiceStatus(serviceId, 'under_review', 'Fix spelling');
  expect(result.success).toBe(true);
});

// Test ownerDeleteService
test('ownerDeleteService fails if not owner', async () => {
  expect(() => ownerDeleteService(serviceId, wrongUserId)).toThrow('Unauthorized');
});

// Test adminEditService
test('adminEditService updates fields', async () => {
  await adminEditService(serviceId, { name: 'New Name' });
  const updated = await getService(serviceId);
  expect(updated.name).toBe('New Name');
});
```

### Integration Tests
```javascript
test('Admin workflow: edit, review, reject', async () => {
  // Edit service
  await adminEditService(serviceId, { name: 'Fixed' });
  
  // Request review
  await updateServiceStatus(serviceId, 'under_review', 'Check changes');
  
  // Verify owner sees warning
  const service = await getService(serviceId);
  expect(service.status).toBe('under_review');
});
```

---

## Performance Considerations

- `getAllServicesAdmin()` loads all services - cache for 30s if needed
- `getServices()` filters on query level (optimized)
- Indexes recommended on: `status`, `sellerId`, `createdAt`

## Future Enhancements

- [ ] Add role-based access control
- [ ] Add audit log tracking
- [ ] Add bulk operations API
- [ ] Add service history/versioning
- [ ] Add approval workflow automation
