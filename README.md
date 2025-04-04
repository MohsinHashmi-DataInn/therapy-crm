# Therapy CRM

A comprehensive Customer Relationship Management system designed specifically for therapy practices.

## Overview

Therapy CRM is a full-stack application built with a modern tech stack to streamline the management of therapy practices. It provides robust client management, appointment scheduling, waitlist management, and communication tracking.

## Features

- **Client Management**: Store and manage client information, contact details, and session history
- **Appointment Scheduling**: Schedule, reschedule, and track therapy sessions
- **Waitlist Management**: Manage clients waiting for services with priority handling
- **Communication Tracking**: Log and monitor all client communications
- **User Authentication**: Role-based access control for therapists, admins, and staff
- **Dashboard Analytics**: Monitor practice performance with insightful metrics
- **Practice Settings**: Manage practice information, details, and configurations
- **Billing Management**: Handle billing information, addresses, and payment details
- **Notification Preferences**: Configure personalized notification settings for different events
- **Role-Based Access**: Different functionality available to Admin, Therapist, and Staff users

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: High-quality UI components built with Radix UI and Tailwind
- **TanStack Query**: Data fetching, caching, and state management
- **React Hook Form**: Form handling with Zod validation
- **Axios**: HTTP client for API requests

### Backend
- **NestJS**: Progressive Node.js framework
- **TypeScript**: For type safety and better developer experience
- **Prisma**: Type-safe database client
- **PostgreSQL**: Relational database
- **JWT**: Authentication with JSON Web Tokens
- **Swagger**: API documentation

## Project Structure

The project follows a monorepo structure with separate frontend and backend applications:

```
/therapy-crm/
  ├─ /apps/
  │   ├─ /web/                  # Next.js frontend
  │   │   ├─ /app/              # Next.js App Router pages
  │   │   ├─ /components/       # Reusable UI components
  │   │   ├─ /hooks/            # Custom React hooks
  │   │   ├─ /lib/              # Utility functions and types
  │   │   └─ ...
  │   ├─ /backend/              # NestJS backend
  │   │   ├─ /src/
  │   │   │   ├─ /modules/      # Feature modules
  │   │   │   ├─ /common/       # Shared utilities and services
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
   
   # Start the backend development server
   npm run start:dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../web
   npm install
   
   # Start the frontend development server
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - API Documentation: http://localhost:5000/api/docs

## Development

### API Endpoints

The backend provides RESTful API endpoints for all resources:

- `/api/clients` - Client management
- `/api/appointments` - Appointment scheduling
- `/api/waitlist` - Waitlist management
- `/api/communications` - Communication tracking
- `/api/auth` - Authentication and user management
- `/api/practice` - Practice information management
- `/api/billing` - Billing details and management
- `/api/users` - User management and notification preferences
- `/api/health` - API health monitoring

For full API documentation, visit the Swagger UI at `/api/docs` when the backend is running.

## Data Models

### User
- `id`: Unique identifier
- `email`: User email address (unique)
- `password`: Encrypted password
- `firstName`, `lastName`: User name
- `phone`: Contact number
- `role`: ADMIN, THERAPIST, or STAFF
- `isActive`: Account status
- `createdAt`, `updatedAt`: Timestamps
- `notificationPreference`: Related preferences

### Client
- `id`: Unique identifier
- `firstName`, `lastName`: Client name
- `email`: Client email (optional, unique)
- `phone`: Contact number
- `address`: Physical address
- `status`: ACTIVE, INACTIVE, ARCHIVED, or WAITLIST
- `priority`: LOW, MEDIUM, or HIGH
- `notes`: Additional information
- `therapistId`: Assigned therapist
- `createdAt`, `updatedAt`: Timestamps

### Appointment
- `id`: Unique identifier
- `title`: Appointment title
- `startTime`, `endTime`: Schedule times
- `status`: SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, or NOSHOW
- `location`: Appointment location
- `notes`: Additional information
- `clientId`: Associated client
- `learnerId`: Associated learner (optional)
- `therapistId`: Assigned therapist
- `cancellationReason`: Reason if cancelled
- `createdAt`, `updatedAt`: Timestamps

### Communication
- `id`: Unique identifier
- `type`: EMAIL, PHONE, INPERSON, VIDEO, or SMS
- `subject`: Communication subject
- `content`: Message content
- `sentAt`: Timestamp of sending
- `notes`: Additional information
- `clientId`: Associated client
- `learnerId`: Associated learner (optional)
- `appointmentId`: Related appointment (optional)
- `userId`: Sending user (optional)
- `createdAt`, `updatedAt`: Timestamps

### Waitlist
- `id`: Unique identifier
- `serviceType`: THERAPY, ASSESSMENT, or CONSULTATION
- `status`: WAITING, PLACED, or CANCELLED
- `requestDate`: Date of request
- `preferredSchedule`: Preferred timing
- `notes`: Additional information
- `clientId`: Associated client
- `createdAt`, `updatedAt`: Timestamps

### Practice
- `id`: Unique identifier
- `name`: Practice name
- `address`, `city`, `state`, `zipCode`: Practice location
- `phone`, `email`, `website`: Contact information
- `hoursOfOperation`: Business hours
- `billingName`, `billingEmail`: Billing contact
- `billingAddress`, `billingCity`, `billingState`, `billingZipCode`: Billing address
- `stripeCustomerId`, `stripeSubscriptionId`: Payment integration
- `subscriptionStatus`: Subscription status
- `createdAt`, `updatedAt`: Timestamps

### NotificationPreference
- `id`: Unique identifier
- `userId`: Associated user
- `emailNotifications`: Email notification toggle
- `smsNotifications`: SMS notification toggle
- `pushNotifications`: Push notification toggle
- `createdAt`, `updatedAt`: Timestamps

## License

This project is licensed under the MIT License - see the LICENSE file for details.
