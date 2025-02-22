const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStreets() {
    try {
        const streets = await prisma.street.findMany({
            take: 10, // Limit to 10 results
        });

        console.log("✅ Found Streets:", streets);
    } catch (error) {
        console.error("❌ Error checking streets:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStreets();
