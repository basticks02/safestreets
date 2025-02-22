-- CreateTable
CREATE TABLE "StreetReport" (
    "id" TEXT NOT NULL,
    "streetName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reports" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreetReport_pkey" PRIMARY KEY ("id")
);
