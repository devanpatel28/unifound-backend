# UniFound API Reference

Base URL (Vercel): `https://your-deployment.vercel.app`  
All authenticated routes require: `Authorization: Bearer <token>`

---

## Auth

### POST `/api/auth/register`
```json
// Request
{
  "university_id": "22CS001",
  "email": "user@university.edu",
  "password": "Min8chars",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "9876543210"
}

// Response 201
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "university_id": "22CS001",
    "email": "user@university.edu",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "9876543210"
  }
}
```

### POST `/api/auth/login`
```json
// Request
{ "university_id": "22CS001", "password": "Min8chars" }

// Response 200
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "university_id": "22CS001",
    "email": "user@university.edu",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "9876543210",
    "profile_image_url": "https://..." // nullable
  }
}
```

---

## Items

### GET `/api/items`
Query params: `type=lost|found`, `category=<uuid>`, `claimed=true|false` (default: false)

```json
// Response 200
{
  "success": true,
  "items": [{
    "id": "uuid",
    "item_name": "Headphones",
    "item_type": "lost",
    "description": "...",
    "location": "Library",
    "date_lost_found": "2024-03-20",
    "images": [{ "url": "https://...", "file_id": "...", "thumbnail_url": "https://..." }],
    "is_claimed": false,
    "is_active": true,
    "created_at": "2024-03-20T10:00:00Z",
    "users": { "first_name": "John", "last_name": "Doe", "phone": "...", "email": "..." },
    "categories": { "name": "Headphones", "icon_name": "headphones" }
  }]
}
```

### POST `/api/items` 🔒
```json
// Request
{
  "category_id": "uuid",
  "item_type": "lost",           // "lost" | "found"
  "item_name": "Headphones",
  "description": "Black Sony",   // optional
  "location": "Library Block B",
  "date_lost_found": "2024-03-20",
  "images": [{ "url": "...", "file_id": "...", "thumbnail_url": "..." }]  // optional
}

// Response 201
{ "success": true, "item": { ...item } }
```

### GET `/api/items/[id]`
```json
// Response 200
{ "success": true, "item": { ...full item with users & categories } }
```

### GET `/api/items/[id]/related`
Returns up to 10 active unclaimed items in the **same category, opposite type**.
```json
// Response 200
{ "success": true, "items": [ ...items ] }
```

### PATCH `/api/items/[id]` 🔒 *(owner only)*
```json
// Request — any subset of:
{ "item_name": "...", "description": "...", "location": "...", "is_claimed": true }

// Response 200
{ "success": true, "item": { ...updated item } }
```

### DELETE `/api/items/[id]` 🔒 *(owner only)*
```json
// Response 200
{ "success": true }
```

---

## Claims

### POST `/api/claims` 🔒
Raise a claim on a **found** item (you are the person who lost it).
```json
// Request
{
  "item_id": "uuid",           // must be a found-type item, not your own
  "message": "This is mine, I can prove it"  // optional
}

// Response 201
{
  "success": true,
  "claim": {
    "id": "uuid",
    "item_id": "uuid",
    "claimant_id": "uuid",
    "message": "...",
    "status": "pending",
    "rejection_reason": null,
    "confirmed_at": null,
    "rejected_at": null,
    "created_at": "..."
  }
}

// Error responses
// 400 — item is not found-type / already claimed / own item
// 409 — already raised a claim on this item
```

### GET `/api/claims/my` 🔒
My raised claims. Query: `?status=pending|confirmed|rejected`
```json
// Response 200
{
  "success": true,
  "claims": [{
    "id": "uuid",
    "status": "pending",
    "message": "...",
    "rejection_reason": null,
    "confirmed_at": null,
    "rejected_at": null,
    "created_at": "...",
    "items": {
      "id": "uuid",
      "item_name": "Headphones",
      "item_type": "found",
      "location": "...",
      "date_lost_found": "...",
      "images": [...],
      "is_claimed": false,
      "users": { "first_name": "...", "last_name": "...", "phone": "...", "email": "..." },
      "categories": { "name": "...", "icon_name": "..." }
    }
  }]
}
```

### GET `/api/claims/received` 🔒
Claims on my found items. Query: `?status=pending|confirmed|rejected`
```json
// Response 200
{
  "success": true,
  "claims": [{
    "id": "uuid",
    "status": "pending",
    "message": "...",
    "items": { "id": "...", "item_name": "...", ... },
    "claimants": {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "...",
      "email": "...",
      "university_id": "22CS002"
    }
  }]
}
```

### GET `/api/claims/[id]` 🔒 *(claimant or item owner)*
```json
// Response 200
{ "success": true, "claim": { ...claim with items & claimants } }
```

### PATCH `/api/claims/[id]/confirm` 🔒 *(item owner only)*
After physical verification — marks item claimed, auto-rejects other pending claims.
```json
// Request — no body needed

// Response 200
{ "success": true, "claim": { ...claim, "status": "confirmed", "confirmed_at": "..." } }
```

### PATCH `/api/claims/[id]/reject` 🔒 *(item owner only)*
```json
// Request
{ "rejection_reason": "Wrong color, not mine" }  // REQUIRED

// Response 200
{ "success": true, "claim": { ...claim, "status": "rejected", "rejection_reason": "...", "rejected_at": "..." } }
```

---

## Categories

### GET `/api/categories`
```json
// Response 200
{
  "success": true,
  "categories": [{ "id": "uuid", "name": "Mobile Phone", "icon_name": "smartphone" }]
}
```

---

## Upload

### POST `/api/upload` 🔒
`Content-Type: multipart/form-data`

| Field | Type |
|---|---|
| `file` | image file (jpg/png/webp) |

```json
// Response 200
{
  "success": true,
  "image": {
    "file_id": "698b578b...",
    "url": "https://ik.imagekit.io/...",
    "thumbnail_url": "https://ik.imagekit.io/tr:n-ik_ml_thumbnail/..."
  }
}
```

---

## User

### GET `/api/users/profile` 🔒
```json
// Response 200
{
  "success": true,
  "user": {
    "id": "uuid",
    "university_id": "22CS001",
    "email": "...",
    "first_name": "...",
    "last_name": "...",
    "phone": "...",
    "profile_image_url": "...",
    "is_verified": false,
    "created_at": "..."
  }
}
```

### PATCH `/api/users/profile` 🔒
```json
// Request — any subset of:
{ "first_name": "...", "last_name": "...", "phone": "...", "profile_image_url": "..." }

// Response 200
{ "success": true, "message": "Profile updated successfully", "user": { ... } }
```

### PATCH `/api/users/password` 🔒
```json
// Request
{ "current_password": "OldPass1", "new_password": "NewPass1" }

// Response 200
{ "success": true, "message": "Password changed successfully" }
```

### GET `/api/users/items` 🔒
My posted items. Query: `?type=lost|found`, `?claimed=true|false`, `?active=true|false`
```json
// Response 200
{ "success": true, "items": [...], "count": 5 }
```

### GET `/api/users/[id]`  *(public — limited info)*
```json
// Response 200
{
  "success": true,
  "user": { "id": "...", "first_name": "...", "last_name": "...", "profile_image_url": "...", "created_at": "..." }
}
```

### PATCH `/api/users/[id]` 🔒 *(self only)*
```json
// Request
{ "first_name": "...", "last_name": "...", "phone": "...", "profile_image_url": "..." }

// Response 200
{ "success": true, "message": "User updated successfully", "user": { ... } }
```

### DELETE `/api/users/[id]` 🔒 *(self only)*
```json
// Response 200
{ "success": true, "message": "Account deleted successfully" }
```

---

## Admin (requires admin JWT)

### POST `/api/admin/login`
```json
// Request
{ "username": "admin@unifound", "password": "Admin@Charusat" }

// Response 200
{
  "success": true,
  "token": "<admin-jwt>",
  "admin": { "id": "...", "username": "...", "full_name": "...", "email": "..." }
}
```

### GET `/api/admin/stats` 🔒 *(admin)*
```json
// Response 200
{
  "success": true,
  "stats": {
    "total_users": 42,
    "total_items": 120,
    "lost_items": 60,
    "found_items": 45,
    "claimed_items": 15,
    "total_categories": 16
  }
}
```

### GET `/api/admin/items` 🔒 *(admin)*
Query: `?type=lost|found`, `?page=1`, `?limit=20`
```json
// Response 200
{
  "success": true,
  "items": [ ...all items including inactive ],
  "pagination": { "page": 1, "limit": 20, "total": 120, "totalPages": 6 }
}
```

---

## Common Error Responses

```json
// 400 Bad Request
{ "error": "Description of what's missing or invalid" }

// 401 Unauthorized
{ "error": "No token provided" }

// 403 Forbidden
{ "error": "Only the item owner can confirm this claim" }

// 404 Not Found
{ "error": "Item not found" }

// 409 Conflict
{ "error": "You have already raised a claim on this item" }

// 500 Internal Server Error
{ "error": "Failed to ..." }
```

🔒 = Requires `Authorization: Bearer <token>` header
