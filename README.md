# Therapy CRM

A comprehensive Customer Relationship Management system designed specifically for therapy practices.

## Overview

Therapy CRM is a full-stack application built with a modern tech stack to streamline the management of therapy practices. It provides robust client management, appointment scheduling, waitlist management, and communication tracking with a focus on security, compliance, and user experience.

## Detailed Features

### Client Management
- **Client Profiles**: Comprehensive client information storage including contact details, status, and priority levels
- **Client Relationships**: Link clients with caregivers, therapists, and learners
- **Multi-language Support**: Client profiles with preferred language settings and interpreter requirements
- **Record Permissions**: Granular access control for sensitive client information
- **Client Funding**: Track insurance, private pay, and other funding sources

### Appointment Management
- **Scheduling System**: Create, view, update, and delete appointments with conflict detection
- **Recurring Appointments**: Set up recurring sessions with customizable patterns
- **Group Sessions**: Manage group therapy sessions with multiple participants
- **Room Allocation**: Assign therapy rooms and equipment to appointments
- **Appointment Staff**: Assign multiple staff members with different roles to appointments
- **Cancellation Tracking**: Record and analyze cancellation reasons and patterns

### Telehealth Integration
- **Virtual Sessions**: Create and manage telehealth appointments
- **Provider Integration**: Support for multiple telehealth service providers
- **Session Recording**: Secure storage and management of session recordings
- **Join Links**: Generate secure links for clients to join virtual sessions
- **Analytics & Reporting**: Track telehealth usage, duration, and outcomes
- **Export Options**: Generate Excel and CSV reports for telehealth sessions

### Treatment Planning
- **Customizable Plans**: Create and manage individualized treatment plans
- **Goal Tracking**: Set, monitor, and update therapeutic goals
- **Progress Notes**: Document session outcomes and client progress
- **Assessment Integration**: Link assessments and their results to treatment plans

### Billing & Financial Management
- **Invoice Generation**: Create and manage client invoices
- **Insurance Claims**: Process and track insurance claims
- **Payment Processing**: Record and manage payments
- **Service Codes**: Manage therapy service codes with associated rates
- **Financial Reporting**: Generate financial reports and statements

### Waitlist Management
- **Prioritized Waitlist**: Manage client waitlist with customizable priority levels
- **Service Type Tracking**: Categorize waitlist entries by requested service types
- **Status Updates**: Track waitlist status changes and placement outcomes
- **Notification System**: Alert staff when waitlist positions become available

### Communication System
- **Multi-channel Communication**: Track emails, phone calls, SMS, and in-person communications
- **Messaging Threads**: Organize communications in threaded conversations
- **Security Features**: Encryption options and security classifications for sensitive communications
- **Document Attachments**: Attach and manage files within communications
- **Access Logging**: Track who has accessed sensitive communications

### Document Management
- **Secure Storage**: Store and manage therapy-related documents
- **Version Control**: Track document versions and changes
- **Category Organization**: Organize documents by type and purpose
- **Access Controls**: Set permissions for document access
- **Retention Policies**: Manage document retention and expiration

### Analytics & Reporting
- **Practice Metrics**: Track key performance indicators for the practice
- **Custom Reports**: Generate reports on appointments, clients, and financial data
- **Data Visualization**: Visual representations of practice analytics
- **Export Options**: Download reports in multiple formats (Excel, CSV)

### User Management
- **Role-based Access**: Different permissions for Admin, Therapist, Staff, and Receptionist roles
- **Profile Management**: User profile settings and preferences
- **Notification Preferences**: Customizable notification settings per user
- **Activity Logging**: Track user actions for security and compliance

### Practice Administration
- **Multi-location Support**: Manage multiple practice locations
- **Room Management**: Track and allocate therapy rooms and equipment
- **Business Settings**: Configure practice details, hours, and contact information
- **Billing Configuration**: Set up billing information and payment integrations

## API Documentation

The application provides a comprehensive RESTful API with the following endpoints:

### Authentication & User Management
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh-token` - Refresh authentication token
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/:id/notification-preferences` - Get user notification preferences
- `PUT /api/users/:id/notification-preferences` - Update notification preferences

### Client Management
- `GET /api/clients` - List all clients with filtering options
- `POST /api/clients` - Create a new client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client information
- `DELETE /api/clients/:id` - Delete a client
- `GET /api/clients/:id/appointments` - Get client appointments
- `GET /api/clients/:id/communications` - Get client communications
- `GET /api/clients/:id/documents` - Get client documents
- `GET /api/clients/:id/insurance` - Get client insurance information
- `POST /api/clients/:id/insurance` - Add insurance information
- `GET /api/clients/:id/learners` - Get client's associated learners

### Appointment Management
- `GET /api/appointments` - List appointments with filtering options
- `POST /api/appointments` - Create a new appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update an appointment
- `DELETE /api/appointments/:id` - Delete an appointment
- `POST /api/appointments/:id/cancel` - Cancel an appointment
- `GET /api/appointments/conflicts` - Check for scheduling conflicts
- `POST /api/appointments/recurring` - Create recurring appointments
- `GET /api/appointments/:id/participants` - Get group session participants
- `POST /api/appointments/:id/participants` - Add participant to group session

### Telehealth Management
- `POST /api/telehealth/sessions` - Create a new virtual session
- `GET /api/telehealth/sessions` - List virtual sessions
- `GET /api/telehealth/sessions/:id` - Get virtual session details
- `PUT /api/telehealth/sessions/:id/status` - Update session status
- `POST /api/telehealth/sessions/:id/recordings` - Add session recording
- `POST /api/telehealth/sessions/:id/join` - Generate participant join link
- `GET /api/telehealth/providers` - List telehealth providers
- `GET /api/telehealth/reports/excel` - Generate Excel report
- `GET /api/telehealth/reports/csv` - Generate CSV report
- `GET /api/telehealth/analytics` - Get telehealth usage analytics

### Waitlist Management
- `GET /api/waitlist` - List waitlist entries
- `POST /api/waitlist` - Add client to waitlist
- `GET /api/waitlist/:id` - Get waitlist entry details
- `PUT /api/waitlist/:id` - Update waitlist entry
- `DELETE /api/waitlist/:id` - Remove from waitlist
- `PUT /api/waitlist/:id/status` - Update waitlist status

### Communication Management
- `GET /api/communications` - List communications
- `POST /api/communications` - Create new communication
- `GET /api/communications/:id` - Get communication details
- `PUT /api/communications/:id` - Update communication
- `DELETE /api/communications/:id` - Delete communication
- `GET /api/communications/threads` - List message threads
- `POST /api/communications/threads` - Create new message thread
- `GET /api/communications/threads/:id` - Get thread messages

### Billing & Finance
- `GET /api/billing/invoices` - List invoices
- `POST /api/billing/invoices` - Create new invoice
- `GET /api/billing/invoices/:id` - Get invoice details
- `PUT /api/billing/invoices/:id` - Update invoice
- `GET /api/billing/service-codes` - List service codes
- `POST /api/billing/payments` - Record payment
- `GET /api/billing/claims` - List insurance claims
- `POST /api/billing/claims` - Submit insurance claim

### Practice Management
- `GET /api/practice` - Get practice information
- `PUT /api/practice` - Update practice information
- `GET /api/practice/locations` - List practice locations
- `POST /api/practice/locations` - Add new location
- `GET /api/practice/rooms` - List therapy rooms
- `POST /api/practice/equipment` - Manage therapy equipment

### Document Management
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload new document
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download document

### System Health & Monitoring
- `GET /api/health` - Check API health status
- `GET /api/health/database` - Check database connection
- `GET /api/health/metrics` - Get system performance metrics

## Data Models

### User
- **Core Properties**: `id`, `email`, `password`, `firstName`, `lastName`, `phone`, `role`, `isActive`
- **Timestamps**: `createdAt`, `updatedAt`, `lastLoginAt`
- **Settings**: `notificationPreferences`, `defaultTheme`, `timezone`
- **Roles**: `ADMIN`, `THERAPIST`, `STAFF`, `RECEPTIONIST`
- **Relations**: Manages clients, appointments, communications, and documents

### Client
- **Core Properties**: `id`, `firstName`, `lastName`, `email`, `phone`, `address`, `status`, `priority`, `notes`
- **Status Options**: `ACTIVE`, `INACTIVE`, `ARCHIVED`, `WAITLIST`
- **Priority Levels**: `LOW`, `MEDIUM`, `HIGH`
- **Language Settings**: `preferredLanguage`, `requiresInterpreter`, `interpreterNotes`
- **Relations**: Connected to therapists, appointments, communications, learners, and funding sources

### Learner
- **Core Properties**: `id`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `course`, `schedule`, `status`, `notes`
- **Status Options**: `ACTIVE`, `INACTIVE`, `GRADUATED`, `ONHOLD`
- **Relations**: Connected to clients, instructors, appointments, and documents

### Appointment
- **Core Properties**: `id`, `title`, `startTime`, `endTime`, `status`, `location`, `notes`
- **Status Options**: `SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NOSHOW`
- **Session Types**: `isRecurring`, `isGroupSession`, `maxParticipants`
- **Location Details**: `roomId`, `locationId`
- **Recurrence**: `recurrencePatternId`, `parentAppointmentId`
- **Relations**: Connected to clients, therapists, learners, equipment, and staff

### Appointment Recurrence Pattern
- **Core Properties**: `id`, `frequency`, `interval`, `daysOfWeek`, `startDate`, `endDate`, `occurrenceCount`
- **Frequency Options**: `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `CUSTOM`
- **Relations**: Connected to recurring appointments

### Communication
- **Core Properties**: `id`, `type`, `subject`, `content`, `sentAt`, `notes`
- **Type Options**: `EMAIL`, `PHONE`, `INPERSON`, `VIDEO`, `SMS`
- **Security Features**: `isEncrypted`, `encryptionStatus`, `securityClassification`, `retentionPeriodDays`, `expirationDate`
- **Status Tracking**: `isRead`, `readAt`, `readBy`, `requiresSignature`, `signedAt`, `signedBy`
- **Relations**: Connected to clients, learners, appointments, users, and threads

### Waitlist
- **Core Properties**: `id`, `serviceType`, `status`, `requestDate`, `preferredSchedule`, `notes`
- **Service Types**: `THERAPY`, `ASSESSMENT`, `CONSULTATION`
- **Status Options**: `WAITING`, `PLACED`, `CANCELLED`
- **Relations**: Connected to clients and service requests

### Virtual Session
- **Core Properties**: `id`, `providerId`, `appointmentId`, `status`, `startUrl`, `joinUrl`, `meetingId`, `password`
- **Status Options**: `SCHEDULED`, `INPROGRESS`, `COMPLETED`, `CANCELLED`, `FAILED`
- **Recording Details**: `isRecorded`, `recordingUrl`, `recordingPassword`, `recordingExpiryDate`
- **Relations**: Connected to appointments, providers, and participants

### Invoice
- **Core Properties**: `id`, `invoiceNumber`, `clientId`, `fundingSource`, `amount`, `status`, `dueDate`, `notes`
- **Status Options**: `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED`, `REFUNDED`
- **Funding Sources**: `INSURANCE`, `PRIVATE`, `SCHOLARSHIP`, `GRANT`
- **Relations**: Connected to clients, line items, payments, and claims

### Practice Location
- **Core Properties**: `id`, `practiceId`, `name`, `address`, `phone`, `email`, `hoursOfOperation`
- **Relations**: Connected to rooms, equipment, and appointments

### Document
- **Core Properties**: `id`, `title`, `filePath`, `fileName`, `fileType`, `fileSize`, `category`, `tags`, `notes`
- **Security Settings**: `accessLevel`, `isEncrypted`, `retentionPeriodDays`, `expirationDate`
- **Relations**: Connected to clients, learners, users, and categories

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router for server and client components
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Shadcn UI**: High-quality UI components built with Radix UI and Tailwind
- **TanStack Query**: Data fetching, caching, and state management
- **React Hook Form**: Form handling with Zod validation
- **Axios**: HTTP client for API requests
- **Date-fns**: Date manipulation library
- **React DayPicker**: Date selection components
- **Radix UI**: Accessible UI primitives

### Backend
- **NestJS**: Progressive Node.js framework for building server-side applications
- **TypeScript**: For type safety and better developer experience
- **Prisma**: Type-safe database client and ORM
- **PostgreSQL**: Relational database for data storage
- **JWT**: Authentication with JSON Web Tokens
- **Passport**: Authentication middleware
- **Swagger/OpenAPI**: API documentation
- **ExcelJS**: Excel file generation for reports
- **csv-writer**: CSV file generation for reports
- **class-validator**: Input validation
- **bcrypt**: Password hashing

## Project Structure

The project follows a monorepo structure with separate frontend and backend applications:

```
/therapy-crm/
  ├─ /apps/
  │   ├─ /web/                  # Next.js frontend
  │   │   ├─ /app/              # Next.js App Router pages
  │   │   │   ├─ /(auth)/       # Authentication pages
  │   │   │   ├─ /(dashboard)/  # Dashboard and feature pages
  │   │   │   ├─ /api/          # API route handlers
  │   │   ├─ /components/       # Reusable UI components
  │   │   ├─ /contexts/         # React context providers
  │   │   ├─ /hooks/            # Custom React hooks
  │   │   ├─ /lib/              # Utility functions and types
  │   │   ├─ /styles/           # Global styles and Tailwind config
  │   │   └─ ...
  │   ├─ /backend/              # NestJS backend
  │   │   ├─ /src/
  │   │   │   ├─ /modules/      # Feature modules
  │   │   │   │   ├─ /analytics/      # Analytics and reporting
  │   │   │   │   ├─ /appointment/    # Appointment management
  │   │   │   │   ├─ /assessment/     # Client assessments
  │   │   │   │   ├─ /auth/           # Authentication
  │   │   │   │   ├─ /billing/        # Billing and invoicing
  │   │   │   │   ├─ /client/         # Client management
  │   │   │   │   ├─ /communication/  # Communication system
  │   │   │   │   ├─ /document-storage/ # Document management
  │   │   │   │   ├─ /health/         # System health
  │   │   │   │   ├─ /learner/        # Learner management
  │   │   │   │   ├─ /telehealth/     # Telehealth features
  │   │   │   │   ├─ /treatment-plan/ # Treatment planning
  │   │   │   │   ├─ /user/           # User management
  │   │   │   │   └─ /waitlist/       # Waitlist management
  │   │   │   ├─ /common/       # Shared utilities and services
  │   │   │   ├─ /config/       # Application configuration
  │   │   │   └─ ...
  │   │   ├─ /prisma/           # Database schema and migrations
  │   │   └─ ...
  └─ ...
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database

### Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/therapy-crm.git
   cd therapy-crm
   ```

2. **Backend Setup**
   ```bash
   cd apps/backend
   npm install
   
   # Configure environment variables
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Run database migrations
   npx prisma migrate dev
   
   # Start the backend development server
   npm run start:dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../web
   npm install
   
   # Configure environment variables
   cp .env.example .env.local
   # Edit .env.local with your API URL
   
   # Start the frontend development server
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - API Documentation: http://localhost:5000/api/docs

## Authentication

The application uses JWT-based authentication with the following features:
- Secure token-based authentication
- Role-based access control
- Token refresh mechanism
- Password hashing with bcrypt
- Session management

## Security Features

- **Data Encryption**: Sensitive data encryption at rest and in transit
- **Access Control**: Role-based permissions system
- **Audit Logging**: Track user actions and data access
- **Secure Communications**: Encrypted client communications
- **Document Security**: Access controls for sensitive documents
- **Password Policies**: Strong password requirements and hashing
- **Session Management**: Secure session handling and timeout

## Compliance

The system is designed with healthcare compliance in mind:
- Patient data protection
- Secure record keeping
- Audit trails for data access
- Retention policies for documents and communications
- Role-based access to sensitive information

Data Models
Below is the complete overview of all 46 tables in the Therapy CRM database schema. Each table lists its purpose, core columns, data types, and default/constraints.

1. analytics_metrics
Purpose: Stores definitions for various tracked analytics metrics.

id (bigint, PK, non-null)

metric_name (text, non-null)

metric_category (text, non-null)

description (text, nullable)

calculation_formula (text, nullable)

display_order (integer, non-null, default=0)

is_active (boolean, non-null, default=true)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

2. appointment_equipment
Purpose: Junction table linking appointments to therapy equipment.

appointment_id (bigint, PK component, non-null)

equipment_id (bigint, PK component, non-null)

quantity (integer, non-null, default=1)

notes (text, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

3. appointment_group_participants
Purpose: Junction table for group therapy appointments, linking appointments to learners.

appointment_id (bigint, PK component, non-null)

learner_id (bigint, PK component, non-null)

notes (text, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

4. appointment_recurrence_patterns
Purpose: Stores recurring scheduling rules for appointments.

id (bigint, PK, non-null)

frequency (recurrence_frequency, non-null)

interval (integer, non-null, default=1)

days_of_week (text, nullable)

start_date (timestamp, non-null)

end_date (timestamp, nullable)

occurrence_count (integer, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

5. appointment_staff
Purpose: Junction table linking appointments to staff (users) with a specific role.

appointment_id (bigint, PK component, non-null)

user_id (bigint, PK component, non-null)

role (therapist_role, non-null)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

6. appointments
Purpose: Main table for scheduling therapy appointments.

id (bigint, PK, non-null)

title (text, non-null)

start_time (timestamp, non-null)

end_time (timestamp, non-null)

status (appointment_status, non-null, default='SCHEDULED')

location (text, nullable)

notes (text, nullable)

client_id (bigint, non-null)

learner_id (bigint, nullable)

therapist_id (bigint, non-null)

cancellation_reason (text, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

is_recurring (boolean, non-null, default=false)

is_group_session (boolean, non-null, default=false)

max_participants (integer, nullable)

room_id (bigint, nullable)

recurrence_pattern_id (bigint, nullable)

parent_appointment_id (bigint, nullable)

location_id (bigint, nullable)

7. auth_logs
Purpose: Logs user authentication activity.

id (bigint, PK, non-null)

user_id (bigint, non-null)

action (text, non-null)

ip_address (text, nullable)

user_agent (text, nullable)

success (boolean, non-null, default=true)

timestamp (timestamp, non-null, default=CURRENT_TIMESTAMP)

details (text, nullable)

8. client_funding
Purpose: Tracks external funding programs or scholarships allocated to a client.

id (bigint, PK, non-null)

client_id (bigint, non-null)

funding_program_id (bigint, non-null)

reference_number (text, nullable)

status (text, non-null)

total_amount (numeric(15,2), non-null)

remaining_amount (numeric(15,2), non-null)

start_date (date, non-null)

end_date (date, non-null)

approval_date (date, nullable)

approved_by (text, nullable)

notes (text, nullable)

created_at, updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

9. client_insurance
Purpose: Tracks insurance details for a client.

id (bigint, PK, non-null)

client_id (bigint, non-null)

insurance_provider_id (bigint, non-null)

policy_number (text, non-null)

group_number (text, nullable)

member_id (text, non-null)

policy_holder_name (text, non-null)

policy_holder_dob (date, nullable)

relationship_to_client (text, non-null)

coverage_start_date, coverage_end_date (date, nullable)

max_annual_coverage, remaining_coverage (numeric(15,2), nullable)

coverage_details (text, nullable)

is_primary (boolean, non-null, default=true)

verification_date (date, nullable)

verified_by (bigint, nullable)

created_at, updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

10. clients
Purpose: Master table for therapy clients.

id (bigint, PK, non-null)

first_name (text, non-null)

last_name (text, non-null)

email (text, nullable)

phone (text, non-null)

address (text, nullable)

status (client_status, non-null, default='ACTIVE')

priority (priority, non-null, default='MEDIUM')

notes (text, nullable)

therapist_id (bigint, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

preferred_language (language_code, non-null, default='EN')

requires_interpreter (boolean, non-null, default=false)

interpreter_notes (text, nullable)

11. communication_access_logs
Purpose: Logs user access to communications or communication attachments.

id (bigint, PK, non-null)

communication_id (bigint, nullable)

attachment_id (bigint, nullable)

user_id (bigint, non-null)

access_type (text, non-null)

access_timestamp (timestamp, non-null, default=CURRENT_TIMESTAMP)

ip_address (text, nullable)

user_agent (text, nullable)

success (boolean, non-null, default=true)

12. communication_attachments
Purpose: Stores file attachments associated with a communication record.

id (bigint, PK, non-null)

communication_id (bigint, non-null)

file_name (text, non-null)

file_type (text, non-null)

file_size (integer, non-null)

file_path (text, non-null)

upload_date (timestamp, non-null, default=CURRENT_TIMESTAMP)

security_classification (security_classification, non-null, default='INTERNAL')

encryption_status (encryption_status, non-null, default='ENCRYPTED_AT_REST')

checksum (text, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by (bigint, nullable)

13. communications
Purpose: Stores multi-channel communications (email, phone, SMS, etc.) with optional encryption.

id (bigint, PK, non-null)

type (communication_type, non-null)

subject (text, non-null)

content (text, non-null)

sent_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

notes (text, nullable)

client_id (bigint, non-null)

learner_id (bigint, nullable)

appointment_id (bigint, nullable)

user_id (bigint, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, nullable)

created_by, updated_by (bigint, nullable)

is_encrypted (boolean, non-null, default=false)

encryption_status (encryption_status, nullable)

security_classification (security_classification, nullable)

retention_period_days (integer, nullable)

expiration_date (timestamp, nullable)

is_read (boolean, non-null, default=false)

read_at (timestamp, nullable)

read_by (bigint, nullable)

requires_signature (boolean, non-null, default=false)

signed_at (timestamp, nullable)

signed_by (bigint, nullable)

thread_id (bigint, nullable)

14. content_translations
Purpose: Stores multi-language translations for certain content types.

id (bigint, PK, non-null)

content_type (text, non-null)

content_id (text, non-null)

language (language_code, non-null)

translated_content (text, non-null)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

15. dashboard_widgets
Purpose: Configurations of dashboard widgets for each user.

id (bigint, PK, non-null)

user_id (bigint, non-null)

widget_type (text, non-null)

title (text, non-null)

metric_ids (text, nullable)

chart_type (text, nullable)

time_range (text, nullable)

custom_query (text, nullable)

position_x (integer, non-null, default=0)

position_y (integer, non-null, default=0)

width (integer, non-null, default=1)

height (integer, non-null, default=1)

is_active (boolean, non-null, default=true)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, non-null)

16. document_access_logs
Purpose: Logs user access to documents.

id (bigint, PK, non-null)

document_id (bigint, non-null)

user_id (bigint, non-null)

action_type (varchar(50), non-null)

access_timestamp (timestamp, non-null, default=CURRENT_TIMESTAMP)

ip_address (varchar(45), nullable)

user_agent (varchar(255), nullable)

additional_info (text, nullable)

17. document_categories
Purpose: Categorizes documents (e.g., CLINICAL, ADMINISTRATIVE).

id (bigint, PK, non-null)

name (varchar(100), non-null)

description (text, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

18. document_permissions
Purpose: Access control records for documents, specifying user-based permissions.

id (bigint, PK, non-null)

document_id (bigint, non-null)

user_id (bigint, non-null)

permission_type (varchar(50), non-null)

granted_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

expires_at (timestamp, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by (bigint, non-null)

19. documents
Purpose: Repository for stored documents, with metadata and security classifications.

id (bigint, PK, non-null)

title (varchar(255), non-null)

file_path (varchar(255), non-null)

file_name (varchar(255), non-null)

file_type (varchar(100), non-null)

file_size (bigint, non-null)

mime_type (varchar(100), non-null)

category_id (bigint, nullable)

client_id (bigint, nullable)

learner_id (bigint, nullable)

uploader_id (bigint, non-null)

upload_date (timestamp, non-null, default=CURRENT_TIMESTAMP)

description (text, nullable)

tags (character varying[], nullable)

security_classification (security_classification, non-null, default='CONFIDENTIAL')

is_encrypted (boolean, non-null, default=true)

encryption_key_id (varchar(255), nullable)

checksum (varchar(255), non-null)

retention_period_days (integer, nullable)

expiration_date (timestamp, nullable)

version (integer, non-null, default=1)

is_latest_version (boolean, non-null, default=true)

parent_document_id (bigint, nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, non-null)

20. funding_authorizations
Purpose: Authorizes funds from a client_funding source to pay an invoice.

id (bigint, PK, non-null)

client_funding_id (bigint, non-null)

invoice_id (bigint, non-null)

authorization_number (text, nullable)

authorized_date (date, non-null)

authorized_amount (numeric(15,2), non-null)

status (text, non-null)

notes (text, nullable)

created_at, updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

21. funding_programs
Purpose: Master table for external funding programs (grants, scholarships, etc.).

id (bigint, PK, non-null)

name (text, non-null)

program_type (text, non-null)

description (text, nullable)

max_amount (numeric(15,2), nullable)

coverage_period (text, nullable)

age_restrictions (text, nullable)

documentation_required (text, nullable)

renewal_process (text, nullable)

website (text, nullable)

contact_information (text, nullable)

application_process (text, nullable)

is_active (boolean, non-null, default=true)

province (text, nullable)

created_at, updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

22. insurance_claims
Purpose: Tracks insurance claims associated with an invoice.

id (bigint, PK, non-null)

invoice_id (bigint, non-null)

insurance_id (bigint, non-null)

claim_number (text, nullable)

submission_date (date, non-null)

status (claim_status, non-null, default='PENDING')

amount_claimed (numeric(15,2), non-null)

amount_approved (numeric(15,2), nullable)

amount_paid (numeric(15,2), nullable)

payment_date (date, nullable)

denial_reason (text, nullable)

notes (text, nullable)

follow_up_date (date, nullable)

created_at, updated_at (timestamp, non-null)

created_by, updated_by (bigint, nullable)

23. insurance_providers
Purpose: Master list of insurance providers.

id (bigint, PK, non-null)

name (text, non-null)

contact_person (text, nullable)

phone (text, nullable)

email (text, nullable)

website (text, nullable)

address (text, nullable)

city (text, nullable)

province (text, nullable)

postal_code (text, nullable)

submission_portal (text, nullable)

submission_format (text, nullable)

electronic_filing (boolean, non-null, default=false)

notes (text, nullable)

is_active (boolean, non-null, default=true)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

24. invoice_line_items
Purpose: Line-item breakdown of services or products on an invoice.

id (bigint, PK, non-null)

invoice_id (bigint, non-null)

service_code_id (bigint, non-null)

description (text, non-null)

service_date (date, non-null)

quantity (numeric(10,2), non-null)

unit_price (numeric(15,2), non-null)

tax_rate (numeric(5,2), non-null, default=0)

tax_amount (numeric(15,2), non-null, default=0)

discount_amount (numeric(15,2), non-null, default=0)

line_total (numeric(15,2), non-null)

appointment_id (bigint, nullable)

learner_id (bigint, nullable)

25. invoices
Purpose: Tracks billing invoices for clients.

id (bigint, PK, non-null)

invoice_number (text, non-null)

client_id (bigint, non-null)

funding_source (funding_source, non-null)

insurance_id (bigint, nullable)

funding_id (bigint, nullable)

status (invoice_status, non-null, default='DRAFT')

issue_date (date, non-null)

due_date (date, non-null)

subtotal (numeric(15,2), non-null)

tax_amount (numeric(15,2), non-null, default=0)

discount_amount (numeric(15,2), non-null, default=0)

total_amount (numeric(15,2), non-null)

amount_paid (numeric(15,2), non-null, default=0)

balance (numeric(15,2), non-null)

notes (text, nullable)

payment_instructions (text, nullable)

terms_conditions (text, nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

26. learners
Purpose: Represents a learner or student associated with a client.

id (bigint, PK, non-null)

first_name (text, non-null)

last_name (text, non-null)

date_of_birth (timestamp, nullable)

gender (text, nullable)

course (text, nullable)

schedule (text, nullable)

status (learner_status, non-null, default='ACTIVE')

notes (text, nullable)

client_id (bigint, non-null)

instructor_id (bigint, nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

27. messaging_threads
Purpose: Threads for organizing messages or communications related to a client.

id (bigint, PK, non-null)

subject (text, non-null)

client_id (bigint, non-null)

is_active (boolean, non-null, default=true)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, non-null)

created_by (bigint, nullable)

last_message_at (timestamp, nullable)

28. metrics_snapshots
Purpose: Periodic snapshots of analytics metrics over time.

id (bigint, PK, non-null)

metric_id (bigint, non-null)

snapshot_date (date, non-null)

value (numeric(15,2), non-null)

comparison_value (numeric(15,2), nullable)

comparison_period (text, nullable)

notes (text, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

29. notification_preferences
Purpose: Stores user preferences for notifications.

id (bigint, PK, non-null)

user_id (bigint, non-null)

email_notifications (boolean, non-null, default=true)

sms_notifications (boolean, non-null, default=false)

push_notifications (boolean, non-null, default=false)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

updated_at (timestamp, non-null)

30. payments
Purpose: Records payments made on invoices.

id (bigint, PK, non-null)

invoice_id (bigint, non-null)

payment_date (date, non-null)

amount (numeric(15,2), non-null)

payment_method (payment_method, non-null)

reference_number (text, nullable)

notes (text, nullable)

received_by (bigint, nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

31. permission_types
Purpose: Master list of available permission types (e.g., VIEW_CLIENT, EDIT_BILLING).

id (bigint, PK, non-null)

name (text, non-null)

description (text, nullable)

category (text, nullable)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

32. practice
Purpose: Stores information about the main therapy practice or business.

id (bigint, PK, non-null)

name (text, non-null)

address, city, state, zip_code (text, nullable)

phone, email, website (text, nullable)

hours_of_operation (text, nullable)

billing_address, billing_city, billing_state, billing_zip_code (text, nullable)

billing_email, billing_name (text, nullable)

stripe_customer_id, stripe_subscription_id (text, nullable)

subscription_status (text, nullable, default='inactive')

primary_language (language_code, non-null, default='EN')

supported_languages (text, nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

33. practice_locations
Purpose: Additional locations or branches for a given practice.

id (bigint, PK, non-null)

practice_id (bigint, non-null)

name (text, non-null)

address, city, province, postal_code (text, non-null)

phone, email (text, nullable)

is_main_location (boolean, non-null, default=false)

is_active (boolean, non-null, default=true)

hours_of_operation (text, nullable)

directions (text, nullable)

latitude (numeric(10,8), nullable)

longitude (numeric(11,8), nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

34. record_permissions
Purpose: Specifies fine-grained record-level permissions for clients or learners.

id (bigint, PK, non-null)

user_id (bigint, non-null)

permission_id (bigint, non-null)

client_id (bigint, nullable)

learner_id (bigint, nullable)

granted (boolean, non-null, default=true)

granted_by (bigint, nullable)

granted_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

expires_at (timestamp, nullable)

35. role_permissions
Purpose: Assigns permission IDs to user roles for broad role-based access.

id (bigint, PK, non-null)

role (user_role, non-null)

permission_id (bigint, non-null)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

36. service_codes
Purpose: Catalog of services offered, each with a billing rate.

id (bigint, PK, non-null)

code (text, non-null)

description (text, non-null)

rate (numeric(15,2), non-null)

tax_rate (numeric(5,2), non-null, default=0)

billable_unit (text, non-null)

minimum_duration (integer, nullable)

notes (text, nullable)

is_active (boolean, non-null, default=true)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

37. telehealth_providers
Purpose: Master table of telehealth providers/integrations.

id (bigint, PK, non-null)

name (varchar(100), non-null)

description (text, nullable)

api_endpoint (varchar(255), nullable)

api_key_name, api_secret_name (varchar(100), nullable)

supports_recording, supports_screen_sharing, supports_waiting_room, supports_breakout_rooms (boolean, default=false)

max_participants, max_duration_minutes (integer, nullable)

is_active (boolean, non-null, default=true)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

38. therapy_equipment
Purpose: Inventory of therapy-related equipment.

id (bigint, PK, non-null)

name (text, non-null)

description (text, nullable)

quantity (integer, non-null, default=1)

is_available (boolean, non-null, default=true)

notes (text, nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

39. therapy_rooms
Purpose: Physical rooms for conducting therapy sessions.

id (bigint, PK, non-null)

name (text, non-null)

capacity (integer, nullable)

description (text, nullable)

equipment (text, nullable)

is_active (boolean, non-null, default=true)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

location_id (bigint, nullable)

40. user_locations
Purpose: Junction table linking users to practice locations.

user_id (bigint, PK component, non-null)

location_id (bigint, PK component, non-null)

is_primary (boolean, non-null, default=false)

created_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

41. user_permissions
Purpose: Assigns specific permission IDs to users.

id (bigint, PK, non-null)

user_id (bigint, non-null)

permission_id (bigint, non-null)

granted (boolean, non-null, default=true)

granted_by (bigint, nullable)

granted_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

expires_at (timestamp, nullable)

42. users
Purpose: Master user table for authentication and roles.

id (bigint, PK, non-null)

email (text, non-null)

password (text, non-null)

first_name, last_name (text, non-null)

is_email_verified (boolean, non-null, default=false)

email_verification_token (text, nullable)

email_verification_token_expires (timestamp, nullable)

phone (text, nullable)

role (user_role, non-null, default='THERAPIST')

is_active (boolean, non-null, default=true)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)

portal_access (boolean, non-null, default=false)

portal_last_login (timestamp, nullable)

require_password_change (boolean, non-null, default=false)

account_locked (boolean, non-null, default=false)

failed_login_attempts (integer, non-null, default=0)

password_reset_token (text, nullable)

password_reset_expires (timestamp, nullable)

last_password_change (timestamp, nullable)

preferred_language (language_code, non-null, default='EN')

secondary_languages (text, nullable)

43. virtual_session_participants
Purpose: Tracks participants in a telehealth session (internal or external).

id (bigint, PK, non-null)

session_id (bigint, non-null)

participant_type (varchar(50), non-null)

user_id (bigint, nullable)

external_email, external_name (varchar(255), nullable)

personal_join_link (varchar(1024), nullable)

join_token (varchar(255), nullable)

attended (boolean, nullable, default=false)

join_time, leave_time (timestamp, nullable)

duration_minutes (integer, nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

44. virtual_session_recordings
Purpose: Stores metadata about recorded telehealth sessions.

id (bigint, PK, non-null)

session_id (bigint, non-null)

recording_url (varchar(1024), non-null)

recording_type (varchar(50), non-null)

start_time (timestamp, non-null)

end_time (timestamp, nullable)

duration_minutes (integer, nullable)

file_size_bytes (bigint, nullable)

is_processing (boolean, non-null, default=false)

is_available (boolean, non-null, default=false)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by (bigint, non-null)

45. virtual_sessions
Purpose: Represents a scheduled telehealth session.

id (bigint, PK, non-null)

appointment_id (bigint, nullable)

provider_id (bigint, non-null)

meeting_id (varchar(255), non-null)

meeting_password (varchar(255), nullable)

host_link (varchar(1024), non-null)

join_link (varchar(1024), non-null)

scheduled_start_time (timestamp, non-null)

scheduled_end_time (timestamp, non-null)

actual_start_time, actual_end_time (timestamp, nullable)

duration_minutes (integer, nullable)

status (varchar(50), non-null, default='SCHEDULED')

cancellation_reason (text, nullable)

notes (text, nullable)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, non-null)

46. waitlist
Purpose: Tracks clients placed on a waitlist for therapy services.

id (bigint, PK, non-null)

service_type (service_type, non-null)

status (waitlist_status, non-null, default='WAITING')

request_date (timestamp, non-null, default=CURRENT_TIMESTAMP)

preferred_schedule (text, nullable)

notes (text, nullable)

client_id (bigint, non-null)

created_at, updated_at (timestamp, non-null, default=CURRENT_TIMESTAMP)

created_by, updated_by (bigint, nullable)