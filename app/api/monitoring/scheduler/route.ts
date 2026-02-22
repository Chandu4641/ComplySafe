import { NextResponse } from "next/server";
import { runMonitoringScheduler } from "@/lib/monitoring/scheduler";

async function handleSchedulerRequest(request: Request) {
  const provided = request.headers.get("x-monitoring-secret") || "";
  const url = new URL(request.url);
  const providedQuery = url.searchParams.get("token") || "";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const required = process.env.MONITORING_SCHEDULER_SECRET || "";

  if (!isVercelCron && (!required || (provided !== required && providedQuery !== required))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runMonitoringScheduler();
  return NextResponse.json({ result });
}

export async function GET(request: Request) {
  return handleSchedulerRequest(request);
}

export async function POST(request: Request) {
  return handleSchedulerRequest(request);
}
