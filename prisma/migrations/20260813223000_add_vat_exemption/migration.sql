CREATE TABLE "VatExemptionSettings" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "homeCountry" TEXT NOT NULL DEFAULT '',
  "allowedCountries" TEXT NOT NULL DEFAULT 'AT,BE,BG,HR,CY,CZ,DE,DK,EE,ES,FI,FR,GR,HU,IE,IT,LT,LU,LV,MT,NL,PL,PT,RO,SE,SI,SK',
  "customerTag" TEXT NOT NULL DEFAULT 'vat-exempt',
  "widgetMode" TEXT NOT NULL DEFAULT 'both',
  "showCartBlock" BOOLEAN NOT NULL DEFAULT true,
  "showDrawer" BOOLEAN NOT NULL DEFAULT true,
  "showExpressWarning" BOOLEAN NOT NULL DEFAULT true,
  "title" TEXT NOT NULL DEFAULT 'VAT exemption',
  "description" TEXT NOT NULL DEFAULT 'Enter a valid EU VAT number to shop tax-free.',
  "buttonLabel" TEXT NOT NULL DEFAULT 'Validate VAT number',
  "retentionDays" INTEGER NOT NULL DEFAULT 365,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VatExemptionSettings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VatValidation" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "vatNumber" TEXT NOT NULL,
  "valid" BOOLEAN NOT NULL,
  "status" TEXT NOT NULL,
  "companyName" TEXT,
  "customerId" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VatValidation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VatExemptionSettings_shopId_key" ON "VatExemptionSettings"("shopId");
CREATE INDEX "VatValidation_shopId_checkedAt_idx" ON "VatValidation"("shopId", "checkedAt");
CREATE INDEX "VatValidation_shopId_email_idx" ON "VatValidation"("shopId", "email");
ALTER TABLE "VatExemptionSettings" ADD CONSTRAINT "VatExemptionSettings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VatValidation" ADD CONSTRAINT "VatValidation_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
