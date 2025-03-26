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

For full API documentation, visit the Swagger UI at `/api/docs` when the backend is running.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
