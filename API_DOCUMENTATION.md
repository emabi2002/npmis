# 🔌 PNG Police Management System - API Documentation

## Complete API Reference Guide

**Version**: 1.0.0
**Last Updated**: January 2025
**Base URL**: https://your-police-system.vercel.app
**API Type**: RESTful API with JSON responses
**Authentication**: Session-based with API key for external integrations

---

## 📚 Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Core System APIs](#core-system-apis)
4. [Database Management APIs](#database-management-apis)
5. [Integration APIs](#integration-apis)
6. [Webhook APIs](#webhook-apis)
7. [Utility APIs](#utility-apis)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [API Testing](#api-testing)

---

## 🎯 API Overview

### System Architecture
The PNG Police Management System provides a comprehensive RESTful API built on Next.js API Routes, offering both internal system functionality and external integration capabilities.

```typescript
interface APIArchitecture {
  framework: "Next.js 15 API Routes"
  runtime: "Vercel Serverless Functions"
  database: "Neon PostgreSQL with @vercel/postgres"
  authentication: "Session-based + API Key"
  response_format: "JSON"
  error_handling: "HTTP status codes + error objects"
}
```

### Base URLs and Environments
```typescript
interface Environments {
  production: {
    base_url: "https://your-police-system.vercel.app"
    database: "policesystem (Neon PostgreSQL)"
    integration_target: "https://cybercrime-3h6o.vercel.app"
  }

  preview: {
    base_url: "https://your-police-system-preview.vercel.app"
    database: "policesystem-staging"
    integration_target: "https://cybercrime-staging.vercel.app"
  }
}
```

### API Conventions
```typescript
interface APIConventions {
  http_methods: {
    GET: "Retrieve data"
    POST: "Create new resources"
    PUT: "Update existing resources"
    DELETE: "Remove resources"
    PATCH: "Partial updates"
  }

  response_structure: {
    success: "200-299 status codes"
    client_error: "400-499 status codes"
    server_error: "500-599 status codes"
    data_format: "JSON with consistent structure"
  }

  naming_conventions: {
    endpoints: "kebab-case"
    parameters: "snake_case"
    responses: "camelCase for JavaScript compatibility"
  }
}
```

---

## 🔐 Authentication

### Session-Based Authentication (Internal)

#### Current User Context
```typescript
interface UserSession {
  authentication_method: "Automatic login bypass"
  default_user: {
    badge: "12345"
    name: "Officer 12345"
    role: "commander"
    department: "RPNGC"
    permissions: "full_access"
  }
  session_storage: "localStorage"
  session_duration: "24 hours"
}

// Session validation
function getCurrentUser(request: NextRequest): Promise<User> {
  // Returns default user for current implementation
  return Promise.resolve({
    id: "1",
    badge_number: "12345",
    name: "Officer 12345",
    role: "commander",
    department: "RPNGC",
    permissions: { full_access: true }
  })
}
```

### API Key Authentication (External)

#### Integration Authentication
```typescript
interface APIKeyAuthentication {
  header_name: "x-api-key"
  key_format: "production-api-key-[random]"

  usage: {
    cybercrime_integration: "Required for external API calls"
    webhook_verification: "HMAC-SHA256 signature verification"
    rate_limiting: "Per-key rate limiting applied"
  }

  security: {
    transmission: "HTTPS only"
    storage: "Environment variables (encrypted)"
    rotation: "Quarterly rotation schedule"
    monitoring: "Access logging and audit trail"
  }
}

// API key validation
function validateAPIKey(apiKey: string): boolean {
  const validKeys = [
    process.env.CYBERCRIME_API_KEY,
    process.env.BACKUP_API_KEY_1,
    process.env.BACKUP_API_KEY_2
  ].filter(Boolean)

  return validKeys.includes(apiKey)
}
```

---

## 🔧 Core System APIs

### Health and Status APIs

#### System Health Check
```http
GET /api/health
```

**Purpose**: Comprehensive system health monitoring
**Authentication**: None required
**Rate Limit**: 60 requests/minute

**Response Format**:
```typescript
interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  uptime: number

  services: {
    database: {
      status: "connected" | "disconnected"
      response_time: number
      last_check: string
    }

    cybercrime_integration: {
      status: "connected" | "disconnected"
      response_time: number
      last_successful_sync: string
    }
  }

  metrics: {
    memory_usage: number
    active_connections: number
    cache_hit_ratio: number
  }

  environment: "production" | "preview" | "development"
}
```

**Example Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "database": {
      "status": "connected",
      "response_time": 45,
      "last_check": "2025-01-15T10:30:00.000Z"
    },
    "cybercrime_integration": {
      "status": "connected",
      "response_time": 180,
      "last_successful_sync": "2025-01-15T10:29:30.000Z"
    }
  },
  "metrics": {
    "memory_usage": 128,
    "active_connections": 12,
    "cache_hit_ratio": 0.95
  },
  "environment": "production"
}
```

**Implementation**:
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    const startTime = Date.now()

    // Test database connection
    const dbHealth = await DatabaseService.testConnection()
    const dbResponseTime = Date.now() - startTime

    // Test cybercrime integration
    let cybercrimeHealth = false
    let cybercrimeResponseTime = 0

    try {
      const cyberStartTime = Date.now()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CYBERCRIME_API_URL}/api/health`,
        {
          headers: { 'x-api-key': process.env.CYBERCRIME_API_KEY || '' },
          signal: AbortSignal.timeout(5000)
        }
      )
      cybercrimeResponseTime = Date.now() - cyberStartTime
      cybercrimeHealth = response.ok
    } catch (error) {
      cybercrimeHealth = false
    }

    const health = {
      status: dbHealth.success && cybercrimeHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),

      services: {
        database: {
          status: dbHealth.success ? 'connected' : 'disconnected',
          response_time: dbResponseTime,
          last_check: new Date().toISOString()
        },
        cybercrime_integration: {
          status: cybercrimeHealth ? 'connected' : 'disconnected',
          response_time: cybercrimeResponseTime,
          last_successful_sync: cybercrimeHealth ? new Date().toISOString() : 'unknown'
        }
      },

      metrics: {
        memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        active_connections: 0, // Would be populated from database
        cache_hit_ratio: 0.95
      },

      environment: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503
    })

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      },
      { status: 503 }
    )
  }
}
```

#### Database Connection Test
```http
GET /api/test-neon
```

**Purpose**: Specific database connectivity and configuration test
**Authentication**: None required
**Rate Limit**: 30 requests/minute

**Response Format**:
```typescript
interface DatabaseTestResponse {
  success: boolean
  message: string
  connected: boolean
  database?: string
  host?: string
  tables_status?: string
  next_step?: string
  error?: string
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Neon database configuration detected",
  "connected": true,
  "database": "policesystem",
  "host": "ep-bitter-block-a7asb7u9-pooler.ap-southeast-2.aws.neon.tech",
  "tables_status": "Operational",
  "next_step": "Database ready for operations"
}
```

---

## 🗄️ Database Management APIs

### User Management APIs

#### Get Users List
```http
GET /api/users
```

**Purpose**: Retrieve list of system users/officers
**Authentication**: Session required
**Permissions**: `users.read`

**Query Parameters**:
```typescript
interface UserQueryParams {
  limit?: number          // Default: 50, Max: 100
  offset?: number         // For pagination
  department?: string     // Filter by department
  rank?: string          // Filter by rank
  status?: 'active' | 'inactive' | 'suspended'
  search?: string        // Search by name or badge number
}
```

**Response Format**:
```typescript
interface UsersResponse {
  users: User[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  filters_applied: UserQueryParams
}

interface User {
  id: string
  badge_number: string
  email?: string
  first_name: string
  last_name: string
  rank: string
  department?: string
  station?: string
  province?: string
  phone?: string
  status: 'active' | 'inactive' | 'suspended'
  role: 'officer' | 'sergeant' | 'commander' | 'admin'
  permissions: Record<string, unknown>
  created_at: string
  updated_at: string
  last_login?: string
}
```

#### Create User
```http
POST /api/users
```

**Purpose**: Create new user/officer account
**Authentication**: Session required
**Permissions**: `users.create`

**Request Body**:
```typescript
interface CreateUserRequest {
  badge_number: string     // Required, unique
  email?: string
  first_name: string       // Required
  last_name: string        // Required
  rank: string            // Required
  department?: string
  station?: string
  province?: string
  phone?: string
  role?: 'officer' | 'sergeant' | 'commander' | 'admin'
  status?: 'active' | 'inactive'
  permissions?: Record<string, unknown>
}
```

**Response**: Returns created User object

#### Update User
```http
PUT /api/users/:id
```

**Purpose**: Update existing user/officer information
**Authentication**: Session required
**Permissions**: `users.update`

**Request Body**: Partial User object with updates

#### Delete User
```http
DELETE /api/users/:id
```

**Purpose**: Remove user from system
**Authentication**: Session required
**Permissions**: `users.delete`

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "deleted_at": "2025-01-15T10:30:00.000Z"
}
```

### Incident Management APIs

#### Get Incidents List
```http
GET /api/incidents
```

**Purpose**: Retrieve incident reports
**Authentication**: Session required
**Permissions**: `incidents.read`

**Query Parameters**:
```typescript
interface IncidentQueryParams {
  limit?: number           // Default: 20, Max: 100
  offset?: number          // Pagination
  status?: 'reported' | 'investigating' | 'pending' | 'resolved' | 'closed'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  incident_type?: string   // Filter by incident type
  date_from?: string       // ISO date string
  date_to?: string         // ISO date string
  province?: string        // Geographic filter
  assigned_to?: string     // Officer badge number
  search?: string          // Text search in title/description
}
```

**Response Format**:
```typescript
interface IncidentsResponse {
  incidents: Incident[]
  pagination: PaginationInfo
  filters_applied: IncidentQueryParams
  summary: {
    total_incidents: number
    by_status: Record<string, number>
    by_priority: Record<string, number>
  }
}

interface Incident {
  id: string
  incident_number: string      // Auto-generated: INC-2025-0001
  incident_type: string
  title: string
  description?: string
  location_address: string
  location_coordinates?: [number, number]
  province?: string
  district?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'investigating' | 'pending' | 'resolved' | 'closed'
  reported_by: string          // Badge number
  assigned_to?: string         // Badge number
  supervisor?: string          // Badge number
  date_reported: string
  date_occurred?: string
  date_resolved?: string
  photos?: string[]
  videos?: string[]
  witness_count: number
  evidence_count: number
  weapons_involved: boolean
  drugs_involved: boolean
  domestic_violence: boolean
  created_at: string
  updated_at: string
}
```

#### Create Incident
```http
POST /api/incidents
```

**Purpose**: Report new incident
**Authentication**: Session required
**Permissions**: `incidents.create`

**Request Body**:
```typescript
interface CreateIncidentRequest {
  incident_type: string        // Required
  title: string               // Required
  description?: string
  location_address: string    // Required
  location_coordinates?: [number, number]
  province?: string
  district?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  date_occurred?: string
  witness_count?: number
  evidence_count?: number
  weapons_involved?: boolean
  drugs_involved?: boolean
  domestic_violence?: boolean

  // People involved
  people_involved?: PersonInvolved[]

  // Vehicles involved
  vehicles_involved?: VehicleInvolved[]

  // Initial evidence
  evidence?: EvidenceItem[]
}

interface PersonInvolved {
  person_type: 'victim' | 'suspect' | 'witness' | 'complainant'
  first_name: string
  last_name: string
  middle_name?: string
  gender?: string
  date_of_birth?: string
  nationality?: string
  phone?: string
  email?: string
  address?: string
  physical_description?: string
  role_in_incident?: string
  injuries?: string
  statement_given?: boolean
  cooperation_level?: 'cooperative' | 'uncooperative' | 'unknown'
}

interface VehicleInvolved {
  vehicle_type: string
  make?: string
  model?: string
  year?: number
  color?: string
  license_plate?: string
  owner_name?: string
  driver_name?: string
  damage_description?: string
  towed?: boolean
  impounded?: boolean
}
```

**Response**: Returns created Incident object with auto-generated incident_number

#### Update Incident
```http
PUT /api/incidents/:id
```

**Purpose**: Update incident information
**Authentication**: Session required
**Permissions**: `incidents.update`

**Request Body**: Partial Incident object with updates

#### Get Incident Details
```http
GET /api/incidents/:id
```

**Purpose**: Get detailed incident information including related data
**Authentication**: Session required
**Permissions**: `incidents.read`

**Response Format**:
```typescript
interface IncidentDetailsResponse {
  incident: Incident
  people_involved: PersonInvolved[]
  vehicles_involved: VehicleInvolved[]
  evidence: EvidenceItem[]
  related_cases: Case[]
  activity_log: ActivityLog[]
  investigating_officer?: User
  supervisor?: User
}
```

### Evidence Management APIs

#### Get Evidence List
```http
GET /api/evidence
```

**Purpose**: Retrieve evidence items
**Authentication**: Session required
**Permissions**: `evidence.read`

**Query Parameters**:
```typescript
interface EvidenceQueryParams {
  limit?: number
  offset?: number
  evidence_type?: 'physical' | 'digital' | 'biological' | 'documentary'
  category?: string
  incident_id?: string
  case_id?: string
  collected_by?: string    // Badge number
  date_from?: string
  date_to?: string
  status?: 'collected' | 'analyzed' | 'returned' | 'destroyed'
  search?: string
}
```

**Response Format**:
```typescript
interface EvidenceResponse {
  evidence: Evidence[]
  pagination: PaginationInfo
  filters_applied: EvidenceQueryParams
  summary: {
    total_items: number
    by_type: Record<string, number>
    by_status: Record<string, number>
  }
}

interface Evidence {
  id: string
  evidence_number: string      // Auto-generated: EVD-2025-0001
  incident_id?: string
  case_id?: string
  evidence_type: 'physical' | 'digital' | 'biological' | 'documentary'
  category: string
  description: string
  location_found?: string
  found_by?: string           // Badge number
  collected_by?: string       // Badge number
  date_collected: string
  photos?: string[]
  videos?: string[]
  file_attachments?: string[]
  chain_of_custody: ChainOfCustodyEntry[]
  status: 'collected' | 'analyzed' | 'returned' | 'destroyed'
  storage_location?: string
  custodian?: string          // Badge number
  created_at: string
}

interface ChainOfCustodyEntry {
  handler: string             // Badge number
  action: string
  timestamp: string
  location: string
  purpose: string
  signature: string
}
```

#### Create Evidence
```http
POST /api/evidence
```

**Purpose**: Submit new evidence item
**Authentication**: Session required
**Permissions**: `evidence.create`

**Request Body**:
```typescript
interface CreateEvidenceRequest {
  incident_id?: string
  case_id?: string
  evidence_type: 'physical' | 'digital' | 'biological' | 'documentary'
  category: string            // Required
  description: string         // Required
  location_found?: string
  found_by?: string
  photos?: string[]           // File paths or URLs
  videos?: string[]
  file_attachments?: string[]
  storage_location?: string
  initial_custody_notes?: string
}
```

**Response**: Returns created Evidence object with auto-generated evidence_number

#### Update Evidence Chain of Custody
```http
POST /api/evidence/:id/custody
```

**Purpose**: Add chain of custody entry
**Authentication**: Session required
**Permissions**: `evidence.update`

**Request Body**:
```typescript
interface CustodyUpdateRequest {
  action: string              // Required: 'transferred', 'analyzed', 'returned', etc.
  location: string            // Required: Current location
  purpose: string             // Required: Reason for action
  handler?: string            // Badge number, defaults to current user
  notes?: string
}
```

---

## 🔗 Integration APIs

### Cybercrime Integration APIs

#### Get Cybercrime Statistics
```http
GET /api/cybercrime/stats
```

**Purpose**: Retrieve real-time cybercrime statistics for dashboard
**Authentication**: Session required
**Rate Limit**: 30 requests/minute per user
**Cache**: 30 seconds

**Response Format**:
```typescript
interface CybercrimeStatsResponse {
  active_cases: number
  suspicious_activities: number
  digital_evidence_items: number
  online_investigators: number
  avg_response_time: string
  system_status: 'operational' | 'degraded' | 'maintenance'

  recent_activity: {
    new_cases: number
    cases_updated: number
    alerts_generated: number
    evidence_processed: number
  }

  threat_intelligence: {
    active_threats: number
    high_risk_targets: number
    prevented_attacks: number
    financial_recovery: number
  }

  integration_status: {
    api_connection: 'connected' | 'disconnected'
    last_sync: string
    data_freshness: number      // Minutes since last update
    error_count_24h: number
  }

  recent_alerts: Alert[]
  last_updated: string
}

interface Alert {
  id: string
  type: 'phishing' | 'fraud' | 'cyberbullying' | 'hacking' | 'ransomware'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: string
  status: 'new' | 'investigating' | 'resolved'
  affected_systems?: string[]
  recommended_actions?: string[]
}
```

**Example Response**:
```json
{
  "active_cases": 12,
  "suspicious_activities": 8,
  "digital_evidence_items": 34,
  "online_investigators": 6,
  "avg_response_time": "4.2h",
  "system_status": "operational",
  "recent_activity": {
    "new_cases": 3,
    "cases_updated": 7,
    "alerts_generated": 2,
    "evidence_processed": 15
  },
  "threat_intelligence": {
    "active_threats": 5,
    "high_risk_targets": 12,
    "prevented_attacks": 23,
    "financial_recovery": 125000
  },
  "integration_status": {
    "api_connection": "connected",
    "last_sync": "2025-01-15T10:29:30.000Z",
    "data_freshness": 1,
    "error_count_24h": 0
  },
  "recent_alerts": [
    {
      "id": "alert-001",
      "type": "phishing",
      "severity": "high",
      "title": "Large-scale phishing campaign detected",
      "description": "Targeting banking customers with fake login pages",
      "timestamp": "2025-01-15T09:45:00.000Z",
      "status": "investigating"
    }
  ],
  "last_updated": "2025-01-15T10:30:00.000Z"
}
```

**Implementation**:
```typescript
// src/app/api/cybercrime/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cybercrimeCache } from '@/lib/cybercrime-cache'

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cached = cybercrimeCache.get('statistics')
    if (cached) {
      return NextResponse.json(cached)
    }

    // Fetch from cybercrime system
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CYBERCRIME_API_URL}/api/integration/police-system`,
      {
        headers: {
          'x-api-key': process.env.CYBERCRIME_API_KEY || '',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    )

    if (!response.ok) {
      throw new Error(`Cybercrime API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform data for police system format
    const transformedData = {
      active_cases: data.activeCases || 0,
      suspicious_activities: data.suspiciousActivities || 0,
      digital_evidence_items: data.digitalEvidenceItems || 0,
      online_investigators: data.onlineInvestigators || 0,
      avg_response_time: data.avgResponseTime || 'N/A',
      system_status: data.systemStatus || 'operational',
      recent_activity: data.recentActivity || {},
      threat_intelligence: data.threatIntelligence || {},
      integration_status: {
        api_connection: 'connected',
        last_sync: new Date().toISOString(),
        data_freshness: 0,
        error_count_24h: 0
      },
      recent_alerts: data.recentAlerts || [],
      last_updated: new Date().toISOString()
    }

    // Cache the response
    cybercrimeCache.set('statistics', transformedData)

    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'public, max-age=30'
      }
    })

  } catch (error) {
    console.error('Cybercrime stats API error:', error)

    // Return fallback data
    const fallbackData = {
      active_cases: 12,
      suspicious_activities: 8,
      digital_evidence_items: 34,
      online_investigators: 6,
      avg_response_time: '4.2h',
      system_status: 'operational',
      recent_activity: {
        new_cases: 0,
        cases_updated: 0,
        alerts_generated: 0,
        evidence_processed: 0
      },
      threat_intelligence: {
        active_threats: 0,
        high_risk_targets: 0,
        prevented_attacks: 0,
        financial_recovery: 0
      },
      integration_status: {
        api_connection: 'disconnected',
        last_sync: 'unknown',
        data_freshness: 999,
        error_count_24h: 1
      },
      recent_alerts: [],
      last_updated: new Date().toISOString(),
      error: 'API Unavailable - Showing Cached Data'
    }

    return NextResponse.json(fallbackData, { status: 503 })
  }
}
```

#### Get Cybercrime Cases
```http
GET /api/cybercrime/cases
```

**Purpose**: Retrieve cybercrime case information
**Authentication**: Session required
**Permissions**: `cybercrime.read`

**Query Parameters**:
```typescript
interface CybercrimeCaseParams {
  limit?: number
  offset?: number
  status?: string
  priority?: string
  type?: string
  linked_to_police?: boolean   // Cases linked to police incidents
  date_from?: string
  date_to?: string
}
```

#### Link Police Case to Cybercrime Case
```http
POST /api/cybercrime/link-case
```

**Purpose**: Create bidirectional link between police and cybercrime cases
**Authentication**: Session required
**Permissions**: `cases.link`

**Request Body**:
```typescript
interface LinkCaseRequest {
  police_case_id: string       // Police case ID
  cybercrime_case_id: string   // Cybercrime case ID
  link_type: 'primary' | 'related' | 'evidence_shared'
  linking_reason: string
  evidence_to_share?: string[] // Evidence IDs to share
  access_level: 'read_only' | 'full_access' | 'restricted'
  notes?: string
}
```

**Response**:
```typescript
interface LinkCaseResponse {
  success: boolean
  link_id: string
  created_at: string
  permissions_granted: string[]
  next_steps: string[]
  notifications_sent: string[]  // List of notified officers
}
```

---

## 📨 Webhook APIs

### Incoming Webhooks (Receiving)

#### Cybercrime Alert Webhook
```http
POST /api/webhooks/cybercrime
```

**Purpose**: Receive urgent cybercrime alerts and updates
**Authentication**: HMAC signature verification
**Rate Limit**: 10 requests/minute

**Headers Required**:
```typescript
interface WebhookHeaders {
  'Content-Type': 'application/json'
  'x-signature-256': string    // HMAC-SHA256 signature
  'x-timestamp': string        // Unix timestamp
  'x-request-id': string       // Unique request ID
  'User-Agent': string         // Sending system identifier
}
```

**Request Body Format**:
```typescript
interface WebhookPayload {
  id: string                   // Unique webhook ID
  type: 'urgent_alert' | 'case_update' | 'threat_intelligence' | 'system_status'
  timestamp: number            // Unix timestamp
  source: 'cybercrime_system'
  data: AlertData | CaseUpdateData | ThreatData | StatusData
}

interface AlertData {
  alert_id: string
  alert_type: 'critical_threat' | 'ongoing_attack' | 'data_breach' | 'child_safety'
  severity: 'high' | 'critical'
  title: string
  description: string
  affected_systems: string[]
  recommended_actions: string[]
  expires_at?: string
  related_cases?: string[]
}

interface CaseUpdateData {
  case_id: string
  police_case_link?: string
  status: string
  priority: string
  summary: string
  evidence_updates: EvidenceUpdate[]
  officer_assigned: string
}
```

**Response Format**:
```typescript
interface WebhookResponse {
  success: boolean
  processed_at: string
  webhook_id: string
  actions_taken?: string[]
  notifications_sent?: string[]
}
```

**Example Webhook Processing**:
```typescript
// src/app/api/webhooks/cybercrime/route.ts
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Extract headers
    const signature = request.headers.get('x-signature-256')
    const timestamp = request.headers.get('x-timestamp')
    const requestId = request.headers.get('x-request-id')

    // Get payload
    const payload = await request.text()

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, timestamp)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Parse webhook data
    const webhookData = JSON.parse(payload)

    // Process based on webhook type
    const result = await processWebhook(webhookData)

    return NextResponse.json({
      success: true,
      processed_at: new Date().toISOString(),
      webhook_id: webhookData.id,
      actions_taken: result.actions,
      notifications_sent: result.notifications
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !timestamp) return false

  const secret = process.env.CYBERCRIME_WEBHOOK_SECRET
  if (!secret) return false

  // Check timestamp (prevent replay attacks)
  const webhookTime = parseInt(timestamp)
  const currentTime = Date.now()

  if (Math.abs(currentTime - webhookTime) > 300000) { // 5 minutes
    return false
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  )
}
```

---

## 🛠️ Utility APIs

### File Upload APIs

#### Upload Evidence Files
```http
POST /api/upload/evidence
```

**Purpose**: Upload photos, videos, and documents for evidence
**Authentication**: Session required
**Permissions**: `evidence.create`
**File Size Limit**: 50MB per file
**Supported Formats**: JPG, PNG, PDF, MP4, DOC, DOCX

**Request Format**: `multipart/form-data`
```typescript
interface UploadRequest {
  files: File[]               // Multiple files supported
  evidence_id?: string        // Associate with existing evidence
  incident_id?: string        // Associate with incident
  category: string            // File category
  description?: string        // File description
}
```

**Response Format**:
```typescript
interface UploadResponse {
  success: boolean
  files: UploadedFile[]
  total_size: number
  upload_time: number
}

interface UploadedFile {
  id: string
  filename: string
  original_name: string
  size: number
  mime_type: string
  url: string
  checksum: string
  uploaded_at: string
}
```

#### Upload Profile Photos
```http
POST /api/upload/profile
```

**Purpose**: Upload officer profile photos
**Authentication**: Session required
**File Size Limit**: 5MB
**Supported Formats**: JPG, PNG

### Search APIs

#### Global Search
```http
GET /api/search
```

**Purpose**: Search across incidents, cases, evidence, and people
**Authentication**: Session required
**Rate Limit**: 60 requests/minute

**Query Parameters**:
```typescript
interface SearchParams {
  q: string                   // Search query (required)
  type?: 'incidents' | 'cases' | 'evidence' | 'people' | 'all'
  limit?: number              // Default: 20, Max: 100
  offset?: number
  date_from?: string
  date_to?: string
  exact_match?: boolean       // Default: false
}
```

**Response Format**:
```typescript
interface SearchResponse {
  query: string
  total_results: number
  search_time: number         // Milliseconds

  results: {
    incidents?: SearchResult[]
    cases?: SearchResult[]
    evidence?: SearchResult[]
    people?: SearchResult[]
  }

  suggestions?: string[]      // Query suggestions
}

interface SearchResult {
  id: string
  type: 'incident' | 'case' | 'evidence' | 'person'
  title: string
  description: string
  relevance_score: number
  highlights: string[]        // Matched text snippets
  url: string                // Link to full record
  metadata: Record<string, any>
}
```

#### Advanced Search
```http
POST /api/search/advanced
```

**Purpose**: Complex multi-criteria search
**Authentication**: Session required

**Request Body**:
```typescript
interface AdvancedSearchRequest {
  criteria: SearchCriteria[]
  logic: 'AND' | 'OR'
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

interface SearchCriteria {
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than'
  value: any
  weight?: number             // Relevance weight
}
```

---

## ❌ Error Handling

### Error Response Format
All API endpoints use consistent error response format:

```typescript
interface ErrorResponse {
  error: string               // Error type/code
  message: string             // Human-readable error message
  details?: any              // Additional error details
  timestamp: string          // ISO timestamp
  request_id?: string        // Unique request identifier
  suggestions?: string[]     // Possible solutions
}
```

### HTTP Status Codes

#### 2xx Success
```typescript
const successCodes = {
  200: "OK - Request successful",
  201: "Created - Resource created successfully",
  202: "Accepted - Request accepted for processing",
  204: "No Content - Request successful, no content to return"
}
```

#### 4xx Client Errors
```typescript
const clientErrors = {
  400: "Bad Request - Invalid request format or parameters",
  401: "Unauthorized - Authentication required or failed",
  403: "Forbidden - Insufficient permissions",
  404: "Not Found - Resource does not exist",
  409: "Conflict - Resource conflict (duplicate, etc.)",
  422: "Unprocessable Entity - Validation errors",
  429: "Too Many Requests - Rate limit exceeded"
}
```

#### 5xx Server Errors
```typescript
const serverErrors = {
  500: "Internal Server Error - Unexpected server error",
  502: "Bad Gateway - External service error",
  503: "Service Unavailable - Service temporarily unavailable",
  504: "Gateway Timeout - External service timeout"
}
```

### Error Examples

#### Validation Error (422)
```json
{
  "error": "validation_error",
  "message": "Request validation failed",
  "details": {
    "field_errors": {
      "badge_number": ["Badge number is required"],
      "email": ["Invalid email format"]
    }
  },
  "timestamp": "2025-01-15T10:30:00.000Z",
  "request_id": "req_123456789"
}
```

#### Authentication Error (401)
```json
{
  "error": "authentication_required",
  "message": "Valid authentication credentials required",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "suggestions": [
    "Ensure you are logged in",
    "Check session expiration",
    "Verify API key if using external integration"
  ]
}
```

#### Rate Limit Error (429)
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests, please try again later",
  "details": {
    "limit": 60,
    "window": "1 minute",
    "retry_after": 45
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### Server Error (500)
```json
{
  "error": "internal_server_error",
  "message": "An unexpected error occurred",
  "details": {
    "error_code": "DB_CONNECTION_FAILED",
    "correlation_id": "err_987654321"
  },
  "timestamp": "2025-01-15T10:30:00.000Z",
  "suggestions": [
    "Try again in a few moments",
    "Contact support if problem persists"
  ]
}
```

---

## 🚦 Rate Limiting

### Rate Limit Policy

#### Standard Endpoints
```typescript
interface RateLimits {
  authenticated_users: {
    general_apis: "100 requests/minute"
    search_apis: "60 requests/minute"
    upload_apis: "20 requests/minute"
    database_write: "30 requests/minute"
  }

  public_endpoints: {
    health_check: "60 requests/minute"
    documentation: "200 requests/minute"
  }

  integration_apis: {
    cybercrime_stats: "30 requests/minute"
    webhook_endpoints: "10 requests/minute"
    external_api_calls: "50 requests/minute"
  }
}
```

#### Rate Limit Headers
```typescript
interface RateLimitHeaders {
  'X-RateLimit-Limit': string      // Maximum requests per window
  'X-RateLimit-Remaining': string  // Remaining requests in current window
  'X-RateLimit-Reset': string      // Window reset time (Unix timestamp)
  'X-RateLimit-Window': string     // Window duration in seconds
}
```

#### Rate Limit Exceeded Response
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705320660
X-RateLimit-Window: 60
Retry-After: 45

{
  "error": "rate_limit_exceeded",
  "message": "Too many requests, please try again later",
  "details": {
    "limit": 60,
    "window": "1 minute",
    "retry_after": 45
  }
}
```

---

## 🧪 API Testing

### Testing Endpoints

#### API Health Check
```bash
# Test system health
curl -X GET "https://your-police-system.vercel.app/api/health" \
     -H "Accept: application/json"
```

#### Database Connectivity Test
```bash
# Test database connection
curl -X GET "https://your-police-system.vercel.app/api/test-neon" \
     -H "Accept: application/json"
```

#### Cybercrime Integration Test
```bash
# Test cybercrime statistics (requires session)
curl -X GET "https://your-police-system.vercel.app/api/cybercrime/stats" \
     -H "Accept: application/json" \
     -H "Cookie: session=your-session-cookie"
```

#### Webhook Test (External)
```bash
# Test webhook endpoint with proper signature
PAYLOAD='{"id":"test-123","type":"test","timestamp":1705320600,"data":{}}'
TIMESTAMP=$(date +%s)
SIGNATURE=$(echo -n "${TIMESTAMP}${PAYLOAD}" | openssl dgst -sha256 -hmac "your-webhook-secret" -binary | base64)

curl -X POST "https://your-police-system.vercel.app/api/webhooks/cybercrime" \
     -H "Content-Type: application/json" \
     -H "x-signature-256: sha256=${SIGNATURE}" \
     -H "x-timestamp: ${TIMESTAMP}" \
     -H "x-request-id: test-request-123" \
     -d "${PAYLOAD}"
```

### Test Data Creation

#### Create Test Incident
```bash
# Create test incident
curl -X POST "https://your-police-system.vercel.app/api/incidents" \
     -H "Content-Type: application/json" \
     -H "Cookie: session=your-session-cookie" \
     -d '{
       "incident_type": "Theft",
       "title": "Test Incident",
       "description": "This is a test incident",
       "location_address": "123 Test Street, Port Moresby",
       "priority": "medium",
       "date_occurred": "2025-01-15T10:00:00.000Z"
     }'
```

#### Create Test Evidence
```bash
# Create test evidence
curl -X POST "https://your-police-system.vercel.app/api/evidence" \
     -H "Content-Type: application/json" \
     -H "Cookie: session=your-session-cookie" \
     -d '{
       "evidence_type": "physical",
       "category": "weapon",
       "description": "Test evidence item",
       "location_found": "Crime scene",
       "storage_location": "Evidence room A"
     }'
```

### Postman Collection

#### Collection Structure
```json
{
  "info": {
    "name": "PNG Police Management System API",
    "description": "Complete API collection for testing",
    "version": "1.0.0"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://your-police-system.vercel.app",
      "type": "string"
    },
    {
      "key": "api_key",
      "value": "{{cybercrime_api_key}}",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Health & Status",
      "item": [
        {
          "name": "System Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": "{{base_url}}/api/health"
          }
        }
      ]
    }
  ]
}
```

---

## 📋 API Reference Summary

### Core Endpoints Overview

| Category | Endpoint | Method | Purpose |
|----------|----------|---------|---------|
| **Health** | `/api/health` | GET | System health check |
| **Database** | `/api/test-neon` | GET | Database connectivity test |
| **Users** | `/api/users` | GET, POST, PUT, DELETE | User management |
| **Incidents** | `/api/incidents` | GET, POST, PUT | Incident management |
| **Evidence** | `/api/evidence` | GET, POST, PUT | Evidence management |
| **Cybercrime** | `/api/cybercrime/stats` | GET | Cybercrime statistics |
| **Integration** | `/api/cybercrime/link-case` | POST | Case linking |
| **Webhooks** | `/api/webhooks/cybercrime` | POST | Receive cybercrime alerts |
| **Search** | `/api/search` | GET | Global search |
| **Upload** | `/api/upload/evidence` | POST | File uploads |

### Authentication Summary

| Type | Usage | Implementation |
|------|-------|----------------|
| **Session** | Internal API access | Automatic login (Officer 12345) |
| **API Key** | External integration | `x-api-key` header |
| **Webhook** | Incoming webhooks | HMAC-SHA256 signature |

### Response Format Summary

All successful responses return JSON with appropriate HTTP status codes. Error responses follow consistent format with error type, message, and details.

---

**🔌 Royal Papua New Guinea Constabulary - API Documentation Complete**

*This API documentation provides comprehensive reference for all system endpoints, authentication methods, and integration capabilities. For additional support or clarification on API usage, contact the development team.*

**Document Version**: 1.0.0
**Last Updated**: January 2025
**Next Review**: March 2025
