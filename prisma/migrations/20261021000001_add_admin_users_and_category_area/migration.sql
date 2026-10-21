-- Add area field to Category (KITCHEN | BAR | ALL)
ALTER TABLE "Category" ADD COLUMN "area" TEXT NOT NULL DEFAULT 'ALL';

-- Create AdminUser table for role-based access (OWNER | KITCHEN | BAR)
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "AdminUser_tenantId_username_key" ON "AdminUser"("tenantId", "username");
CREATE INDEX "AdminUser_tenantId_idx" ON "AdminUser"("tenantId");

-- Foreign key
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
