# SessionDB - API Documentation

## Overview

This API documentation allows the **SessionDB Frontend** to function exactly as designed. The endpoints and data structures strictly follow the interfaces defined in the frontend's `useMockState.tsx`.

### Base URL
```
Production:  https://api.sessiondb.com/v1
Development: http://localhost:3000/v1
```

---

### Error Response Contract

All error responses **must** include a `code` field from the shared internal error codes list. The frontend matches on `code` to decide UI behaviour.

```json
{ "success": false, "code": "USR001", "error": "No active credentials for this instance" }
```

**Frontend reference**: `src/constants/errorCodes.ts`

| Code | Value | Description |
|---|---|---|
| `ERR_INVALID_REQUEST` | `REQ001` | Invalid request params |
| `ERR_UNAUTHORIZED` | `AUTH001` | Authentication required |
| `ERR_FORBIDDEN` | `AUTH002` | Permission denied |
| `ERR_DB_ACCESS_DENIED` | `DB001` | Database access denied |
| `ERR_USER_CREDS_REQ` | `USR001` | DB credentials missing (shows modal in Query Editor) |
| `ERR_USER_CREDS_INV` | `USR002` | DB credentials invalid |
| `ERR_NOT_FOUND` | `RES001` | Resource not found |
| `ERR_INTERNAL_ERROR` | `SYS001` | Internal server error |

### Request/Response Format
- **Content-Type**: `application/json`
- **Accept**: `application/json`

---

## 1. Authentication

### Login (Password)
**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "username": "admin_mouli",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "user": {
      "id": "1",
      "name": "admin_mouli",
      "role": "Super Admin",
      "db_username": "sdb_admin",
      "status": "active",
      "isSessionBased": false,
      "lastLogin": "2024-02-06 10:30",
      "permissions": [
        {
          "database": "*",
          "table": "*",
          "privileges": ["ALL"],
          "type": "permanent"
        }
      ],
      "savedScripts": [],
      "queryTabs": [
        {
          "id": "1",
          "name": "Query 1",
          "query": "SELECT * FROM users LIMIT 10;",
          "isActive": true
        }
      ]
    }
  }
}
```

### SSO Login
**Endpoint**: `POST /auth/sso`
**Request**: `{ "provider": "github" }`

### Logout
**Endpoint**: `POST /auth/logout`

---

## 2. Configuration (System Settings)

### Get Auth Config
**Endpoint**: `GET /config/auth`

**Response**:
```json
{
  "type": "password" 
}
// OR
{
  "type": "sso"
}
```

### Update Auth Config
**Endpoint**: `PUT /config/auth`

**Request**:
```json
{
  "type": "sso" // or "password"
}
```

---

## 3. User Management

### List Users
**Endpoint**: `GET /users`

**Response**:
```json
[
  {
    "id": "1",
    "name": "admin_mouli",
    "role": "Super Admin",
    "db_username": "sdb_admin",
    "status": "active",
    "isSessionBased": false,
    "lastLogin": "2024-02-06 10:30",
    "permissions": [...],
    "savedScripts": [...],
    "queryTabs": [...]
  },
  {
    "id": "2",
    "name": "dev_user_01",
    "role": "Developer",
    "db_username": "sdb_dev_01",
    "status": "active",
    "isSessionBased": true,
    "lastLogin": "2024-02-06 09:15",
    "permissions": [],
    "savedScripts": [],
    "queryTabs": []
  }
]
```

### Create User
**Endpoint**: `POST /users`

**Request**:
```json
{
  "name": "new_user",
  "role": "Developer",
  "db_username": "sdb_new_user",
  "status": "active",
  "isSessionBased": false,
  "permissions": [],
  "savedScripts": [],
  "queryTabs": []
}
```

**Response**: Returns the created `User` object with generated `id`.

### Update User
**Endpoint**: `PUT /users/:id`

**Request**: Can include any subset of fields or full object.
```json
{
  "id": "1",
  "name": "admin_mouli",
  "role": "Super Admin",
  "db_username": "sdb_admin",
  "status": "active",
  "isSessionBased": false,
  "lastLogin": "2024-02-06 10:30",
  "permissions": [
    {
      "database": "production",
      "table": "users",
      "privileges": ["READ"],
      "type": "permanent"
    }
  ],
  "savedScripts": [],
  "queryTabs": []
}
```

### Delete User
**Endpoint**: `DELETE /users/:id`

---

## 4. Role Management

### List Roles
**Endpoint**: `GET /roles`

**Response**:
```json
[
  {
    "id": "1",
    "name": "Super Admin",
    "permissions": [
      {
        "database": "*",
        "table": "*",
        "privileges": ["ALL"],
        "type": "permanent"
      }
    ],
    "userCount": 1
  },
  {
    "id": "2",
    "name": "Developer",
    "permissions": [
      {
        "database": "production",
        "table": "users",
        "privileges": ["READ"],
        "type": "permanent"
      }
    ],
    "userCount": 1
  }
]
```

### Create Role
**Endpoint**: `POST /roles`

**Request**:
```json
{
  "name": "Analyst",
  "permissions": [
    {
      "database": "analytics",
      "table": "*",
      "privileges": ["READ"],
      "type": "permanent"
    }
  ]
}
```

### Update Role
**Endpoint**: `PUT /roles/:id`

**Request**:
```json
{
  "id": "2",
  "name": "Developer",
  "permissions": [...],
  "userCount": 1
}
```

### Delete Role
**Endpoint**: `DELETE /roles/:id`

---

## 5. Approval Workflows

### List Requests
**Endpoint**: `GET /requests`

**Response**:
```json
[
  {
    "id": "req_1",
    "type": "TEMP_USER",
    "requester": "external_dev",
    "description": "Access to prod-read-only for debugging bug #102",
    "timestamp": "2024-02-06 11:00",
    "status": "pending",
    "requestedPermissions": [
      {
        "database": "production",
        "table": "orders",
        "privileges": ["READ"],
        "type": "temp",
        "expiry": "24h"
      }
    ]
  }
]
```

### Update Request Status (Approve/Reject)
**Endpoint**: `PUT /requests/:id`

**Request (Approve)**:
```json
{
  "status": "approved",
  "partialPermissions": [ ... ] // Optional: Send only if partially approving specific permissions
}
```

**Request (Reject)**:
```json
{
  "status": "rejected"
}
```

---

## 6. Audit Logs

### List Logs
**Endpoint**: `GET /logs`

**Response**:
```json
[
  {
    "id": "log_1",
    "timestamp": "2024-02-06 10:35:00",
    "user": "admin_mouli",
    "session_user": "sdb_admin",
    "action": "LOGIN",
    "resource": "System",
    "status": "Success",
    "query": null,
    "table": null
  }
]
```

### Create Log (Client-side events)
**Endpoint**: `POST /logs`

**Request**:
```json
{
  "user": "admin_mouli",
  "action": "VIEW_PAGE",
  "resource": "Audit Logs",
  "status": "Success"
}
```

---

## 7. User Context (Persisted State)

### Save Script
**Endpoint**: `POST /me/scripts`

**Request**:
```json
{
  "name": "My Query",
  "query": "SELECT * FROM users"
}
```

**Response**:
```json
{
  "id": "script_123",
  "name": "My Query",
  "query": "SELECT * FROM users",
  "timestamp": "2024-02-06 12:00"
}
```

### Sync Query Tabs
**Endpoint**: `PUT /me/tabs`

**Request**:
```json
[
  {
    "id": "tab_1",
    "name": "Query 1",
    "query": "SELECT * FROM users",
    "isActive": true
  },
  {
    "id": "tab_2",
    "name": "New Tab",
    "query": "",
    "isActive": false
  }
]
```

### Execute Query
**Endpoint**: `POST /query/execute`

**Request**:
```json
{
  "query": "SELECT * FROM users LIMIT 10"
}
```

**Response**:
```json
{
  "columns": ["id", "name", "email"],
  "rows": [
    ["1", "Alice", "alice@example.com"],
    ["2", "Bob", "bob@example.com"]
  ],
  "rowCount": 2
}
```
// OR for non-SELECT queries
```json
{
  "message": "Query executed successfully",
  "rowsAffected": 1
}
```

---

## Data Models (Reference from `useMockState.tsx`)

### User
```typescript
interface User {
    id: string;
    name: string;
    role: string;
    db_username: string; // Snake case
    status: 'active' | 'inactive';
    isSessionBased: boolean; // Camel case
    lastLogin: string;
    permissions: DBPermission[];
    savedScripts: SavedScript[];
    queryTabs: QueryTab[];
}
```

### DBPermission
```typescript
interface DBPermission {
    database: string;
    table: string;
    privileges: string[]; // ['READ', 'WRITE', 'DELETE', 'EXECUTE', 'ALL']
    type: 'permanent' | 'temp' | 'expiring';
    expiry?: string;
}
```

### Role
```typescript
interface Role {
    id: string;
    name: string;
    permissions: DBPermission[];
    userCount: number;
}
```

### ApprovalRequest
```typescript
interface ApprovalRequest {
    id: string;
    type: 'TEMP_USER' | 'ROLE_CHANGE' | 'PERM_UPGRADE';
    requester: string;
    targetUser?: string;
    description: string;
    timestamp: string;
    requestedPermissions: DBPermission[];
    status: 'pending' | 'approved' | 'rejected' | 'partially_approved';
}
```

### AuditLog
```typescript
interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    session_user?: string;
    action: string;
    resource: string;
    table?: string;
    query?: string;
    status: 'Success' | 'Failure' | 'Warning';
}
```

---

## 8. Database Instance Management

### List Instances (User)
**Endpoint**: `GET /instances`
**Response**: `Array<DBInstance>` (excludes credentials)
```json
[{ "id": "prod-1", "name": "Production", "host": "prod.db.com", "port": 3306, "type": "mysql", "status": "online" }]
```

### List Instances (Admin)
**Endpoint**: `GET /admin/instances`
**Response**: `Array<DBInstance>` (includes metadata)
```json
[{ "id": "prod-1", "name": "Production", "host": "prod.db.com", "port": 3306, "username": "admin", "lastSync": "2024-02-08 12:00" }]
```

### Create Instance
**Endpoint**: `POST /admin/instances`
**Request**: `{ name, host, port, type, username, password }`
**Response**: `{ success: true, data: DBInstance }`

### Update Instance
**Endpoint**: `PUT /admin/instances/:id`
**Request**: Partial update fields.
**Response**: `{ success: true, data: DBInstance }`

### Sync Instance
**Endpoint**: `POST /admin/instances/sync/:id`
**Response**: `{ success: true, message: "Sync started" }`

---

## 9. Real-time Notifications

### Sync Progress (WebSocket)
**Endpoint**: `GET /ws`
**Description**: Connect to this endpoint via WebSocket to receive real-time sync progress updates.
**Message Format**:
```json
{
  "instanceId": "uuid",
  "step": "Tables",
  "status": "processing",
  "percentage": 45,
  "message": "Fetching metadata for table 'users'..."
}
```
---

## 10. Metadata Retrieval

### List Databases
**Endpoint**: `GET /instances/:id/databases`
**Description**: Returns a list of all synced databases for a specific instance.

**Response**:
```json
["production", "analytics", "staging"]
```

### List Tables
**Endpoint**: `GET /instances/:id/databases/:dbName/tables`
**Description**: Returns all tables within a specific database on an instance.

**Response**:
```json
[
  {
    "id": "table-uuid",
    "instanceId": "instance-uuid",
    "database": "production",
    "schema": "public",
    "name": "users",
    "type": "BASE TABLE"
  }
]
```

### Get Table Details
**Endpoint**: `GET /instances/tables/:tableId`
**Description**: Returns detailed metadata for a table, including all columns.

**Response**:
```json
{
  "id": "table-uuid",
  "name": "users",
  "database": "production",
  "schema": "public",
  "columns": [
    {
      "id": "col-uuid",
      "name": "id",
      "dataType": "uuid",
      "isNullable": false,
      "isPrimaryKey": true
    }
  ]
}
```
### Get Instance Schema (Hierarchical)
**Endpoint**: `GET /instances/:id/schema` or `GET /schema?instanceId=:id`
**Description**: Returns all databases, their tables, and columns in a single hierarchical JSON. Use this for the Schema Explorer.

**Response**:
```json
{
  "instanceId": "uuid",
  "databases": [
    {
      "database": "production",
      "tables": [
        {
          "id": "uuid",
          "name": "users",
          "database": "production",
          "schema": "public",
          "columns": [ ... ]
        }
      ]
    }
  ]
}
```

---

## 11. Database User Management

### List DB Users
**Endpoint**: `GET /db-users`

**Query Params**:
| Param | Required | Description |
|---|---|---|
| `instance_id` | No | Filter by instance. Omit to return users across all instances. |

**Response**: `Array<DBUser>`
```json
[
  {
    "id": "dbu_1",
    "username": "sdb_admin",
    "instanceId": "prod-1",
    "instanceName": "Production",
    "role": "db_owner",
    "status": "active",
    "created_at": "2024-02-06 10:30",
    "linkedUserId": "usr_1",
    "linkedUserName": "admin_mouli"
  }
]
```

### Update DB User Role
**Endpoint**: `PUT /db-users/:id`

**Request**:
```json
{
  "role": "read_only"
}
```

**Response**: Returns the updated `DBUser` object.

### Link Platform User to DB User
**Endpoint**: `PUT /db-users/:id/link`

**Request**:
```json
{
  "platform_user_id": "usr_1"  // pass null to unlink
}
```

**Response**: Returns the updated `DBUser` object with `linkedUserId` / `linkedUserName` populated.

---

## Data Models (Additions)

### DBUser
```typescript
interface DBUser {
    id: string;
    username: string;
    instanceId: string;
    instanceName: string;
    role: string;
    privileges?: DBPrivilege[];  // per-object privilege grants
    status: 'active' | 'inactive' | 'expired' | 'locked';
    created_at: string;
    linkedUserId?: string;   // platform user ID linked to this DB account
    linkedUserName?: string; // display name of the linked platform user
}
```

### DBPrivilege
```typescript
interface DBPrivilege {
    object: string;      // table / schema / database name
    type: string;        // SELECT, INSERT, UPDATE, DELETE, EXECUTE, ALL, etc.
    grantable: boolean;  // true = WITH GRANT OPTION
}
```

---

### Verify DB Credentials
**Endpoint**: `POST /db-credentials/verify`

**Request**:
```json
{
  "instanceId": "inst_1",
  "dbPassword": "s3cret"
}
```

**Response** (success):
```json
{
  "success": true,
  "data": {
    "credentialId": "cred_123",
    "dbUsername": "john_doe",
    "instanceId": "inst_1",
    "status": "active"
  }
}
```

**Response** (failure):
```json
{ "success": false, "error": "Invalid credentials" }
```

Tests the provided credentials against the target instance. On success, persists the credential link to the user's `dbCredentials`.

---

### Platform Privileges

The `GET /users/me` response should include:

```json
{
  "platformPrivileges": ["query_editor", "admin_users", "admin_roles", "admin_approvals", "admin_instances", "audit_logs"]
}
```

**Privilege keys**: `query_editor`, `admin_users`, `admin_roles`, `admin_approvals`, `admin_instances`, `audit_logs`

Derived from the user's role or stored as per-user overrides.

---

### Get DB Roles
**Endpoint**: `GET /db-roles?instanceId=<id>`

Returns actual database roles from the specified instance.

**Response**:
```json
[
  {
    "id": "dbr_1",
    "name": "Read Only",
    "dbKey": "read_only",
    "instanceId": "inst_1",
    "instanceName": "Production",
    "memberCount": 5,
    "privileges": [
      { "object": "public.*", "type": "SELECT", "grantable": false }
    ],
    "isSystemRole": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### DBRole Model
```typescript
interface DBRole {
    id: string;
    name: string;           // Pascal Case display name
    dbKey: string;          // snake_case DB identifier
    instanceId: string;
    instanceName: string;
    memberCount: number;
    privileges: DBPrivilege[];
    isSystemRole: boolean;
    createdAt: string;
}
```
