# Enhanced Schema for Autism Therapy CRM

The following models need to be added to the current Prisma schema to properly reflect all new database enhancements:

## Multi-Location Support & Practice Settings

```prisma
// Language code enum for multilingual support
enum language_code {
  EN
  FR
  ES
  ZH
  AR
  UR
  PA
  HI
  DE
  PT
  IT
  RU
}

// Multi-location support
model practice_locations {
  id                BigInt    @id @default(autoincrement())
  practice_id       BigInt
  name              String
  address           String
  city              String
  province          String
  postal_code       String
  phone             String?
  email             String?
  is_main_location  Boolean   @default(false)
  is_active         Boolean   @default(true)
  hours_of_operation String?
  directions        String?
  latitude          Decimal?  @db.Decimal(10,8)
  longitude         Decimal?  @db.Decimal(11,8)
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  created_by        BigInt?
  updated_by        BigInt?
  
  // Relations
  practice          practice  @relation(fields: [practice_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  creator           users?    @relation("practice_locations_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater           users?    @relation("practice_locations_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  // Relation fields
  therapy_rooms     therapy_rooms[]
  appointments      appointments[]
  user_locations    user_locations[]
}

// User location assignments
model user_locations {
  user_id     BigInt
  location_id BigInt
  is_primary  Boolean  @default(false)
  created_at  DateTime @default(now())
  
  // Relations
  user     users             @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  location practice_locations @relation(fields: [location_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@id([user_id, location_id])
}

// Translations for content
model content_translations {
  id                 BigInt       @id @default(autoincrement())
  content_type       String       // EMAIL_TEMPLATE, FORM, DOCUMENT, etc.
  content_id         String       // Reference to the original content
  language           language_code
  translated_content String       @db.Text
  created_at         DateTime     @default(now())
  updated_at         DateTime     @updatedAt
  created_by         BigInt?
  updated_by         BigInt?
  
  // Relations
  creator  users? @relation("content_translations_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater  users? @relation("content_translations_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  @@unique([content_type, content_id, language], name: "unique_content_translation")
}
```

## Analytics and Metrics

```prisma
// Analytics metrics definitions
model analytics_metrics {
  id                 BigInt   @id @default(autoincrement())
  metric_name        String   @unique
  metric_category    String   // CLINICAL, OPERATIONAL, FINANCIAL
  description        String?
  calculation_formula String?
  display_order      Int      @default(0)
  is_active          Boolean  @default(true)
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
  created_by         BigInt?
  updated_by         BigInt?
  
  // Relations
  creator           users? @relation("analytics_metrics_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater           users? @relation("analytics_metrics_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  // Relation fields
  metrics_snapshots metrics_snapshots[]
}

// Dashboard widget configuration
model dashboard_widgets {
  id           BigInt   @id @default(autoincrement())
  user_id      BigInt
  widget_type  String   // CHART, TABLE, METRIC, CALENDAR
  title        String
  metric_ids   String?  // Comma-separated list of metric IDs
  chart_type   String?  // LINE, BAR, PIE, etc.
  time_range   String?  // DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
  custom_query String?
  position_x   Int      @default(0)
  position_y   Int      @default(0)
  width        Int      @default(1)
  height       Int      @default(1)
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  
  // Relations
  user users @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
}

// Metrics history for trending
model metrics_snapshots {
  id               BigInt   @id @default(autoincrement())
  metric_id        BigInt
  snapshot_date    DateTime @db.Date
  value            Decimal  @db.Decimal(15,2)
  comparison_value Decimal? @db.Decimal(15,2)
  comparison_period String?  // PREVIOUS_DAY, PREVIOUS_WEEK, PREVIOUS_MONTH, PREVIOUS_YEAR
  notes            String?
  created_at       DateTime @default(now())
  
  // Relations
  metric analytics_metrics @relation(fields: [metric_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@unique([metric_id, snapshot_date], name: "unique_metric_snapshot")
}
```

## Billing and Funding

```prisma
// Billing enums
enum funding_source {
  PRIVATE_PAY
  INSURANCE
  PROVINCIAL_FUNDING
  FEDERAL_GRANT
  CHARITABLE_GRANT
  SCHOOL_DISTRICT
  OTHER
}

enum invoice_status {
  DRAFT
  PENDING
  SENT
  PAID
  PARTIAL
  OVERDUE
  CANCELLED
  REFUNDED
}

enum payment_method {
  CREDIT_CARD
  DEBIT
  E_TRANSFER
  CASH
  CHEQUE
  DIRECT_DEPOSIT
  INSURANCE_DIRECT
  FUNDING_PROGRAM
}

enum claim_status {
  PENDING
  SUBMITTED
  IN_REVIEW
  APPROVED
  PARTIAL_APPROVAL
  DENIED
  RESUBMITTED
  PAID
  APPEALED
}

// Insurance providers model
model insurance_providers {
  id                 BigInt   @id @default(autoincrement())
  name               String
  contact_person     String?
  phone              String?
  email              String?
  website            String?
  address            String?
  city               String?
  province           String?
  postal_code        String?
  submission_portal  String?
  submission_format  String?
  electronic_filing  Boolean  @default(false)
  notes              String?
  is_active          Boolean  @default(true)
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
  created_by         BigInt?
  updated_by         BigInt?
  
  // Relations
  creator            users? @relation("insurance_providers_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater            users? @relation("insurance_providers_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  // Relation fields
  client_insurance   client_insurance[]
}

// Funding programs model
model funding_programs {
  id                   BigInt   @id @default(autoincrement())
  name                 String
  program_type         String   // PROVINCIAL, FEDERAL, PRIVATE
  description          String?
  max_amount           Decimal? @db.Decimal(15,2)
  coverage_period      String?  // ANNUAL, LIFETIME, AGE_BASED
  age_restrictions     String?
  documentation_required String?
  renewal_process      String?
  website              String?
  contact_information  String?
  application_process  String?
  is_active            Boolean  @default(true)
  province             String?
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  created_by           BigInt?
  updated_by           BigInt?
  
  // Relations
  creator              users? @relation("funding_programs_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater              users? @relation("funding_programs_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  // Relation fields
  client_funding       client_funding[]
}

// Client insurance information
model client_insurance {
  id                  BigInt    @id @default(autoincrement())
  client_id           BigInt
  insurance_provider_id BigInt
  policy_number       String
  group_number        String?
  member_id           String
  policy_holder_name  String
  policy_holder_dob   DateTime? @db.Date
  relationship_to_client String
  coverage_start_date DateTime? @db.Date
  coverage_end_date   DateTime? @db.Date
  max_annual_coverage Decimal?  @db.Decimal(15,2)
  remaining_coverage  Decimal?  @db.Decimal(15,2)
  coverage_details    String?
  is_primary          Boolean   @default(true)
  verification_date   DateTime? @db.Date
  verified_by         BigInt?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt
  created_by          BigInt?
  updated_by          BigInt?
  
  // Relations
  client              clients @relation(fields: [client_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  insurance_provider  insurance_providers @relation(fields: [insurance_provider_id], references: [id], onDelete: Restrict, onUpdate: NoAction)
  verifier            users? @relation("client_insurance_verified_by", fields: [verified_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  creator             users? @relation("client_insurance_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater             users? @relation("client_insurance_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  // Relation fields
  invoices            invoices[]
  insurance_claims    insurance_claims[]
}

// Client funding information
model client_funding {
  id                 BigInt   @id @default(autoincrement())
  client_id          BigInt
  funding_program_id BigInt
  reference_number   String?
  status             String   // APPLIED, APPROVED, PENDING, DENIED
  total_amount       Decimal  @db.Decimal(15,2)
  remaining_amount   Decimal  @db.Decimal(15,2)
  start_date         DateTime @db.Date
  end_date           DateTime @db.Date
  approval_date      DateTime? @db.Date
  approved_by        String?
  notes              String?
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
  created_by         BigInt?
  updated_by         BigInt?
  
  // Relations
  client             clients @relation(fields: [client_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  funding_program    funding_programs @relation(fields: [funding_program_id], references: [id], onDelete: Restrict, onUpdate: NoAction)
  creator            users? @relation("client_funding_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater            users? @relation("client_funding_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  // Relation fields
  invoices           invoices[]
  funding_authorizations funding_authorizations[]
}

// Service codes for billing
model service_codes {
  id               BigInt   @id @default(autoincrement())
  code             String   @unique
  description      String
  rate             Decimal  @db.Decimal(15,2)
  tax_rate         Decimal  @default(0) @db.Decimal(5,2)
  billable_unit    String   // HOUR, SESSION, DAY
  minimum_duration Int?     // in minutes
  notes            String?
  is_active        Boolean  @default(true)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  created_by       BigInt?
  updated_by       BigInt?
  
  // Relations
  creator          users? @relation("service_codes_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater          users? @relation("service_codes_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  // Relation fields
  invoice_line_items invoice_line_items[]
}

// Invoices model
model invoices {
  id                  BigInt         @id @default(autoincrement())
  invoice_number      String         @unique
  client_id           BigInt
  funding_source      funding_source
  insurance_id        BigInt?
  funding_id          BigInt?
  status              invoice_status @default(DRAFT)
  issue_date          DateTime       @db.Date
  due_date            DateTime       @db.Date
  subtotal            Decimal        @db.Decimal(15,2)
  tax_amount          Decimal        @default(0) @db.Decimal(15,2)
  discount_amount     Decimal        @default(0) @db.Decimal(15,2)
  total_amount        Decimal        @db.Decimal(15,2)
  amount_paid         Decimal        @default(0) @db.Decimal(15,2)
  balance             Decimal        @db.Decimal(15,2)
  notes               String?
  payment_instructions String?
  terms_conditions    String?
  created_at          DateTime       @default(now())
  updated_at          DateTime       @updatedAt
  created_by          BigInt?
  updated_by          BigInt?
  
  // Relations
  client              clients @relation(fields: [client_id], references: [id], onDelete: Restrict, onUpdate: NoAction)
  insurance           client_insurance? @relation(fields: [insurance_id], references: [id], onDelete: SetNull, onUpdate: NoAction)
  funding             client_funding? @relation(fields: [funding_id], references: [id], onDelete: SetNull, onUpdate: NoAction)
  creator             users? @relation("invoices_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater             users? @relation("invoices_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  
  // Relation fields
  invoice_line_items  invoice_line_items[]
  payments            payments[]
  insurance_claims    insurance_claims[]
  funding_authorizations funding_authorizations[]
}

// Invoice line items
model invoice_line_items {
  id               BigInt   @id @default(autoincrement())
  invoice_id       BigInt
  service_code_id  BigInt
  description      String
  service_date     DateTime @db.Date
  quantity         Decimal  @db.Decimal(10,2)
  unit_price       Decimal  @db.Decimal(15,2)
  tax_rate         Decimal  @default(0) @db.Decimal(5,2)
  tax_amount       Decimal  @default(0) @db.Decimal(15,2)
  discount_amount  Decimal  @default(0) @db.Decimal(15,2)
  line_total       Decimal  @db.Decimal(15,2)
  appointment_id   BigInt?
  learner_id       BigInt?
  
  // Relations
  invoice          invoices @relation(fields: [invoice_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  service_code     service_codes @relation(fields: [service_code_id], references: [id], onDelete: Restrict, onUpdate: NoAction)
  appointment      appointments? @relation(fields: [appointment_id], references: [id], onDelete: SetNull, onUpdate: NoAction)
  learner          learners? @relation(fields: [learner_id], references: [id], onDelete: SetNull, onUpdate: NoAction)
}

// Payments model
model payments {
  id               BigInt         @id @default(autoincrement())
  invoice_id       BigInt
  payment_date     DateTime       @db.Date
  amount           Decimal        @db.Decimal(15,2)
  payment_method   payment_method
  reference_number String?
  notes            String?
  received_by      BigInt?
  created_at       DateTime       @default(now())
  updated_at       DateTime       @updatedAt
  
  // Relations
  invoice          invoices @relation(fields: [invoice_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  receiver         users? @relation(fields: [received_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
}

// Insurance claims
model insurance_claims {
  id               BigInt       @id @default(autoincrement())
  invoice_id       BigInt
  insurance_id     BigInt
  claim_number     String?
  submission_date  DateTime     @db.Date
  status           claim_status @default(PENDING)
  amount_claimed   Decimal      @db.Decimal(15,2)
  amount_approved  Decimal?     @db.Decimal(15,2)
  amount_paid      Decimal?     @db.Decimal(15,2)
  payment_date     DateTime?    @db.Date
  denial_reason    String?
  notes            String?
  follow_up_date   DateTime?    @db.Date
  created_at       DateTime     @default(now())
  updated_at       DateTime     @updatedAt
  created_by       BigInt?
  updated_by       BigInt?
  
  // Relations
  invoice          invoices @relation(fields: [invoice_id], references: [id], onDelete: Restrict, onUpdate: NoAction)
  insurance        client_insurance @relation(fields: [insurance_id], references: [id], onDelete: Restrict, onUpdate: NoAction)
  creator          users? @relation("insurance_claims_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater          users? @relation("insurance_claims_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
}

// Funding authorizations
model funding_authorizations {
  id                  BigInt   @id @default(autoincrement())
  client_funding_id   BigInt
  invoice_id          BigInt
  authorization_number String?
  authorized_date     DateTime @db.Date
  authorized_amount   Decimal  @db.Decimal(15,2)
  status              String   // PENDING, APPROVED, DENIED
  notes               String?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  created_by          BigInt?
  updated_by          BigInt?
  
  // Relations
  client_funding      client_funding @relation(fields: [client_funding_id], references: [id], onDelete: Restrict, onUpdate: NoAction)
  invoice             invoices @relation(fields: [invoice_id], references: [id], onDelete: Restrict, onUpdate: NoAction)
  creator             users? @relation("funding_authorizations_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater             users? @relation("funding_authorizations_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
}
```

## Enhanced Notifications

```prisma
// Notification enums
enum notification_type {
  APPOINTMENT_REMINDER
  APPOINTMENT_CONFIRMATION
  APPOINTMENT_CANCELLATION
  APPOINTMENT_RESCHEDULED
  INVOICE_CREATED
  PAYMENT_RECEIVED
  DOCUMENT_SHARED
  PROGRESS_NOTE_CREATED
  GOAL_UPDATED
  ASSESSMENT_SCHEDULED
  THERAPY_PLAN_UPDATED
  COMMUNICATION_RECEIVED
  FUNDING_UPDATE
  INSURANCE_CLAIM_UPDATE
  SYSTEM_ANNOUNCEMENT
}

enum notification_delivery_status {
  PENDING
  SENT
  DELIVERED
  FAILED
  READ
}

// Enhanced notification preferences
model notification_preferences {
  id                  BigInt    @id @default(autoincrement())
  user_id             BigInt    @unique
  email_notifications Boolean    @default(true)
  sms_notifications   Boolean    @default(false)
  push_notifications  Boolean    @default(false)
  in_app_notifications Boolean    @default(true)
  email_consent_given Boolean    @default(false)
  email_consent_date  DateTime?
  email_consent_ip    String?
  sms_consent_given   Boolean    @default(false)
  sms_consent_date    DateTime?
  sms_consent_ip      String?
  created_at          DateTime   @default(now())
  updated_at          DateTime   @updatedAt
  updated_by          BigInt?
  
  // Relations
  user                users @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  updater             users? @relation("notification_preferences_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
}

// Per-notification type preferences
model notification_type_preferences {
  id               BigInt           @id @default(autoincrement())
  user_id          BigInt
  notification_type notification_type
  email_enabled    Boolean          @default(true)
  sms_enabled      Boolean          @default(false)
  push_enabled     Boolean          @default(false)
  in_app_enabled   Boolean          @default(true)
  created_at       DateTime         @default(now())
  updated_at       DateTime         @updatedAt
  
  // Relations
  user             users @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@unique([user_id, notification_type], name: "unique_user_notification_type")
}

// Custom reminder settings
model custom_reminder_settings {
  id                      BigInt           @id @default(autoincrement())
  user_id                 BigInt
  reminder_type           notification_type
  advance_notice_hours    Int
  secondary_reminder_hours Int?
  email_template_id       String?
  sms_template_id         String?
  created_at              DateTime         @default(now())
  updated_at              DateTime         @updatedAt
  
  // Relations
  user                   users @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
}

// Client notification preferences
model client_notification_preferences {
  id                  BigInt    @id @default(autoincrement())
  client_id           BigInt    @unique
  email_notifications Boolean    @default(true)
  sms_notifications   Boolean    @default(false)
  therapy_reminders   Boolean    @default(true)
  appointment_changes Boolean    @default(true)
  progress_updates    Boolean    @default(true)
  billing_notifications Boolean   @default(true)
  email_consent_given Boolean    @default(false)
  email_consent_date  DateTime?
  email_consent_ip    String?
  sms_consent_given   Boolean    @default(false)
  sms_consent_date    DateTime?
  sms_consent_ip      String?
  preferred_reminder_time String?
  created_at          DateTime   @default(now())
  updated_at          DateTime   @updatedAt
  updated_by          BigInt?
  
  // Relations
  client              clients @relation(fields: [client_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  updater             users? @relation("client_notification_preferences_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
}

// Notification logs
model notification_logs {
  id                  BigInt                     @id @default(autoincrement())
  user_id             BigInt?
  client_id           BigInt?
  notification_type   notification_type
  title               String
  message             String
  delivery_channel    String                     // EMAIL, SMS, PUSH, IN_APP
  status              notification_delivery_status @default(PENDING)
  sent_at             DateTime?
  delivered_at        DateTime?
  read_at             DateTime?
  error_message       String?
  reference_id        String?                    // External reference ID (e.g., from email or SMS service)
  related_entity_type String?                    // APPOINTMENT, INVOICE, etc.
  related_entity_id   BigInt?
  created_at          DateTime                   @default(now())
  updated_at          DateTime                   @updatedAt
  
  // Relations
  user                users? @relation(fields: [user_id], references: [id], onDelete: SetNull, onUpdate: NoAction)
  client              clients? @relation(fields: [client_id], references: [id], onDelete: SetNull, onUpdate: NoAction)
}

// Notification templates
model notification_templates {
  id              BigInt           @id @default(autoincrement())
  template_code   String           @unique
  name            String
  description     String?
  notification_type notification_type
  subject         String?
  email_body      String?
  sms_body        String?
  push_body       String?
  in_app_body     String?
  is_active       Boolean          @default(true)
  variables       String?          // JSON string of available variables
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt
  created_by      BigInt?
  updated_by      BigInt?
  
  // Relations
  creator         users? @relation("notification_templates_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
  updater         users? @relation("notification_templates_updated_by", fields: [updated_by], references: [id], onDelete: SetNull, onUpdate: NoAction)
}
```

## Existing Model Enhancements

### Add to practice model:
```prisma
model practice {
  // Existing fields...
  
  // Add these new fields:
  primary_language     language_code  @default(EN)
  supported_languages  String?        // Comma-separated list of language codes
  
  // Add this relation:
  practice_locations   practice_locations[]
}
```

### Add to therapy_rooms model:
```prisma
model therapy_rooms {
  // Existing fields...
  
  // Add this field:
  location_id          BigInt?
  
  // Add this relation:
  location             practice_locations? @relation(fields: [location_id], references: [id], onDelete: SetNull, onUpdate: NoAction, map: "fk_therapy_rooms_location")
}
```

### Add to appointments model:
```prisma
model appointments {
  // Existing fields...
  
  // Add this field:
  location_id          BigInt?
  
  // Add these relations:
  location             practice_locations? @relation(fields: [location_id], references: [id], onDelete: SetNull, onUpdate: NoAction, map: "fk_appointments_location")
  invoice_line_items   invoice_line_items[]
}
```

### Add to users model:
```prisma
model users {
  // Existing fields...
  
  // Add these fields:
  preferred_language   language_code  @default(EN)
  secondary_languages  String?        // Comma-separated list of language codes
  
  // Add these relations:
  user_locations                      user_locations[]
  notification_type_preferences       notification_type_preferences[]
  custom_reminder_settings            custom_reminder_settings[]
  notification_logs                   notification_logs[]
  payments_received                   payments[]                      @relation(name: "payments_received_by")
  // And many more relations for the various created_by and updated_by fields...
}
```

### Add to clients model:
```prisma
model clients {
  // Existing fields...
  
  // Add these fields:
  preferred_language    language_code @default(EN)
  requires_interpreter  Boolean       @default(false)
  interpreter_notes     String?
  
  // Add these relations:
  client_insurance      client_insurance[]
  client_funding        client_funding[]
  invoices              invoices[]
  notification_logs     notification_logs[]
  client_notification_preferences client_notification_preferences?
}
```

### Update notification_preferences model:
This model is being completely replaced with an enhanced version in the Enhanced Notifications section.
