# Autism Therapy CRM Enhancements - Migration Guide

This document provides instructions for applying the new database enhancements to your Autism Therapy CRM system.

## Overview of Enhancements

The database schema has been enhanced with the following features:

1. **Multi-Location Support & Practice Settings**
   - Support for multiple therapy locations
   - Room assignments to specific locations
   - Staff-location assignments
   - Multi-lingual support with content translations

2. **Advanced Analytics & Metrics**
   - Clinical and operational KPIs specific to autism therapy
   - Customizable dashboard widgets
   - Metrics snapshots for trend analysis

3. **Billing & Funding Management**
   - Canadian healthcare funding integration
   - Insurance provider management
   - Funding programs tracking
   - Comprehensive invoicing system
   - Payment tracking
   - Insurance claim processing

4. **Enhanced Notifications**
   - CASL-compliant notification preferences
   - Custom reminder settings
   - Robust notification templates
   - Notification logging for audit trails

## Migration Steps

To apply these database changes properly, follow these steps:

### 1. Update Database Schema

**Option 1: Apply the Raw SQL Migrations**

You can directly apply the raw SQL migration files using psql:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d your_database_name

# Within psql, execute each migration file
\i /Users/mohsin/github/therapy-crm/apps/backend/prisma/migrations/part1_secure_communications.sql
\i /Users/mohsin/github/therapy-crm/apps/backend/prisma/migrations/part2_user_roles_portals.sql
\i /Users/mohsin/github/therapy-crm/apps/backend/prisma/migrations/part3_practice_locations.sql
\i /Users/mohsin/github/therapy-crm/apps/backend/prisma/migrations/part4_analytics_billing.sql
\i /Users/mohsin/github/therapy-crm/apps/backend/prisma/migrations/part5_notification_enhancements.sql
```

**Option 2: Use Prisma Migrate (Recommended)**

For a more controlled approach, integrate these changes into the Prisma workflow:

1. Update your `schema.prisma` file with the new models and fields from `enhanced_schema.md`
2. Create and apply a Prisma migration:

```bash
# Generate a new migration
npx prisma migrate dev --name add_therapy_crm_enhancements

# Apply the migration to your database
npx prisma migrate deploy
```

### 2. Update Your Prisma Client

After applying the database changes, update your Prisma client:

```bash
npx prisma generate
```

### 3. Seed Initial Data (Optional)

Some tables like `analytics_metrics` and `notification_templates` have predefined values. These are included in the SQL migration files, but if you're using Prisma migrate, you may want to add this data to your `seed.ts` file.

## API Implementation Considerations

After applying the database changes, you'll need to:

1. Create new API endpoints for the new entities
2. Update existing endpoints that interact with modified entities
3. Implement business logic for:
   - Location management
   - Multi-language support
   - Analytics dashboard
   - Billing and insurance processing
   - Enhanced notification delivery

## Security Considerations

The enhanced schema includes security features for:

- PIPEDA compliance for health information
- Secure communications with encrypted attachments
- Access logging for sensitive information
- Role-based access control
- Client/caregiver portals with limited permissions

Ensure your API implementation enforces these security measures.

## Frontend Implementation

After updating the backend, you'll need to enhance the frontend to support:

1. Multi-location selection in forms and reports
2. Multi-language UI components
3. Analytics dashboards with customizable widgets
4. Enhanced billing and insurance claim interfaces
5. CASL-compliant notification opt-in/opt-out workflows

## Testing Recommendations

1. Create unit tests for all new models and relationships
2. Test database migrations in a staging environment before production
3. Verify data integrity with existing records
4. Test performance with larger datasets for analytics queries
5. Validate all security measures, especially for protected health information
