/*
  Warnings:

  - You are about to drop the column `latitude` on the `Street` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Street` table. All the data in the column will be lost.
  - The `reports` column on the `Street` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "Street_name_key";

-- AlterTable
ALTER TABLE "Street" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "polygonData" JSONB,
ALTER COLUMN "safetyScore" DROP NOT NULL,
DROP COLUMN "reports",
ADD COLUMN     "reports" JSONB;
