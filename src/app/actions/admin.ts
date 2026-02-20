"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile || profile.role !== "ADMIN") throw new Error("No autorizado - solo admin");

  const [totalRequests, totalQuotes, totalOrders, totalWorkshops, totalUsers, totalIncidents, totalReviews] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.quote.count(),
    prisma.workOrder.count(),
    prisma.workshop.count(),
    prisma.userProfile.count(),
    prisma.incidentReport.count(),
    prisma.review.count(),
  ]);

  const avgRating = await prisma.review.aggregate({ _avg: { rating: true } });
  const requestsWithQuotes = await prisma.serviceRequest.count({ where: { quotes: { some: {} } } });

  const topWorkshops = await prisma.workshop.findMany({
    where: { status: "VERIFICADO" },
    orderBy: { rating: "desc" },
    take: 5,
    select: {
      name: true,
      district: true,
      rating: true,
      _count: { select: { workOrders: true } },
    },
  });

  // Category distribution
  const categoryStats = await prisma.category.findMany({
    select: {
      name: true,
      _count: { select: { serviceRequests: true } },
    },
  });
  const totalCatRequests = categoryStats.reduce((sum, c) => sum + c._count.serviceRequests, 0);
  const categoryDistribution = categoryStats
    .map((c) => ({
      name: c.name,
      pct: totalCatRequests > 0 ? Math.round((c._count.serviceRequests / totalCatRequests) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);

  return {
    totalRequests,
    totalQuotes,
    totalOrders,
    totalWorkshops,
    totalUsers,
    totalIncidents,
    totalReviews,
    avgRating: avgRating._avg.rating || 0,
    quoteRate: totalRequests > 0 ? requestsWithQuotes / totalRequests : 0,
    topWorkshops: topWorkshops.map((w) => ({
      name: w.name,
      district: w.district,
      rating: w.rating,
      orders: w._count.workOrders,
    })),
    categoryDistribution,
  };
}
