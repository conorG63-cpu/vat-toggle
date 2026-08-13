-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VatSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "defaultDisplayMode" TEXT NOT NULL DEFAULT 'inclusive',
    "defaultVatRate" REAL NOT NULL DEFAULT 20,
    "showPopupOnFirstVisit" BOOLEAN NOT NULL DEFAULT true,
    "togglePosition" TEXT NOT NULL DEFAULT 'header',
    "inclusiveLabel" TEXT NOT NULL DEFAULT 'Inc. VAT',
    "exclusiveLabel" TEXT NOT NULL DEFAULT 'Ex. VAT',
    "popupTitle" TEXT NOT NULL DEFAULT 'How would you like to see prices?',
    "popupMessage" TEXT NOT NULL DEFAULT 'Choose your preferred pricing display',
    "enableB2BMode" BOOLEAN NOT NULL DEFAULT false,
    "b2bCustomerTags" TEXT NOT NULL DEFAULT 'b2b,wholesale,trade',
    "b2bDefaultMode" TEXT NOT NULL DEFAULT 'exclusive',
    "vatRates" JSONB,
    "toggleStyle" TEXT NOT NULL DEFAULT 'pill',
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "backgroundColor" TEXT NOT NULL DEFAULT '#f4f4f4',
    "activeTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "borderRadius" TEXT NOT NULL DEFAULT 'medium',
    "showVatIndicator" BOOLEAN NOT NULL DEFAULT true,
    "indicatorPosition" TEXT NOT NULL DEFAULT 'after',
    "animationStyle" TEXT NOT NULL DEFAULT 'smooth',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VatSettings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "VatSettings_shopId_key" ON "VatSettings"("shopId");
