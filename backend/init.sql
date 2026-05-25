-- CreateTable
CREATE TABLE "Commodity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "base_price_php" REAL NOT NULL,
    "unit_of_measurement" TEXT NOT NULL,
    "base_unit_multiplier" REAL NOT NULL,
    "display_unit_name" TEXT NOT NULL,
    "icon_slug" TEXT NOT NULL,
    "effective_date" DATETIME NOT NULL,
    "source_url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "contract_amount_php" REAL NOT NULL,
    "date_awarded" DATETIME,
    "contractor_name" TEXT,
    "philgeps_reference_no" TEXT,
    "source_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Awarded',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Commodity_name_effective_date_key" ON "Commodity"("name", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "Anomaly_philgeps_reference_no_key" ON "Anomaly"("philgeps_reference_no");

