-- Create the missing relationship_type enum
CREATE TYPE "relationship_type" AS ENUM (
    'PARENT',
    'GUARDIAN',
    'GRANDPARENT',
    'SIBLING',
    'OTHER_FAMILY',
    'CAREGIVER',
    'CASE_WORKER'
);
