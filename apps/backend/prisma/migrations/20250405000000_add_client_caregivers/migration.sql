-- CreateTable
CREATE TABLE "client_caregivers" (
    "id" BIGSERIAL NOT NULL,
    "clientId" BIGINT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "hasLegalCustody" BOOLEAN DEFAULT false,
    "isEmergencyContact" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,

    CONSTRAINT "client_caregivers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "client_caregivers" ADD CONSTRAINT "fk_client_caregivers_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_caregivers" ADD CONSTRAINT "fk_client_caregivers_created_by" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_caregivers" ADD CONSTRAINT "fk_client_caregivers_updated_by" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
