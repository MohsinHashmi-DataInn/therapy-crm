/*
  Warnings:

  - A unique constraint covering the columns `[stripe_customer_id]` on the table `practice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_subscription_id]` on the table `practice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "practice" ADD COLUMN     "billing_address" TEXT,
ADD COLUMN     "billing_city" TEXT,
ADD COLUMN     "billing_email" TEXT,
ADD COLUMN     "billing_name" TEXT,
ADD COLUMN     "billing_state" TEXT,
ADD COLUMN     "billing_zip_code" TEXT,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT,
ADD COLUMN     "subscription_status" TEXT DEFAULT 'inactive';

-- CreateIndex
CREATE UNIQUE INDEX "practice_stripe_customer_id_key" ON "practice"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "practice_stripe_subscription_id_key" ON "practice"("stripe_subscription_id");
