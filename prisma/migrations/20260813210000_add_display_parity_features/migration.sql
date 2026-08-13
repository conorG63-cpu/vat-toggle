ALTER TABLE "VatSettings"
  ADD COLUMN "settingsVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "widgetPosition" TEXT NOT NULL DEFAULT 'bottom-right',
  ADD COLUMN "desktopOffsetX" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "desktopOffsetY" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "mobileOffsetX" INTEGER NOT NULL DEFAULT 16,
  ADD COLUMN "mobileOffsetY" INTEGER NOT NULL DEFAULT 80,
  ADD COLUMN "widgetPadding" INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN "controlSize" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN "widgetBorderWidth" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "widgetBorderColor" TEXT NOT NULL DEFAULT '#e1e3e5',
  ADD COLUMN "widgetShadow" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN "allowMinimize" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "helperTextSize" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN "helperTextColor" TEXT NOT NULL DEFAULT '#6d7175',
  ADD COLUMN "popupChoiceDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "popupWidth" INTEGER NOT NULL DEFAULT 420,
  ADD COLUMN "popupBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
  ADD COLUMN "popupOverlayColor" TEXT NOT NULL DEFAULT '#000000',
  ADD COLUMN "popupOverlayOpacity" INTEGER NOT NULL DEFAULT 55,
  ADD COLUMN "popupBorderRadius" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN "popupTitleColor" TEXT NOT NULL DEFAULT '#202223',
  ADD COLUMN "popupTextColor" TEXT NOT NULL DEFAULT '#616161',
  ADD COLUMN "popupButtonStyle" TEXT NOT NULL DEFAULT 'solid',
  ADD COLUMN "popupShowClose" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "VatMarketRate" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "marketName" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL DEFAULT '',
  "rate" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VatMarketRate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VatTranslation" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "inclusiveLabel" TEXT NOT NULL,
  "exclusiveLabel" TEXT NOT NULL,
  "popupTitle" TEXT NOT NULL,
  "popupMessage" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VatTranslation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VatMarketRate_shopId_marketId_countryCode_key" ON "VatMarketRate"("shopId", "marketId", "countryCode");
CREATE UNIQUE INDEX "VatTranslation_shopId_locale_key" ON "VatTranslation"("shopId", "locale");
ALTER TABLE "VatMarketRate" ADD CONSTRAINT "VatMarketRate_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VatTranslation" ADD CONSTRAINT "VatTranslation_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
