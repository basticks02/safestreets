/*
  Warnings:

  - You are about to drop the `StreetReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "StreetReport";

-- CreateTable
CREATE TABLE "Street" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "safetyScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "reports" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Street_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Street_name_key" ON "Street"("name");
