/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Street` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Street_name_key" ON "Street"("name");
