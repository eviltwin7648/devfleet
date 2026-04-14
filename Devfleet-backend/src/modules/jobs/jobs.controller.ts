import { Request, Response } from "express";
import { db } from "../../db/db";
import { JobScheduler } from "./job.scheduler";

const createJob = async (req: Request, res: Response) => {
  try {
    // Logic to create a job definition and execution
    const {
      agentId,
      script,
      env,
      title,
      description,
      scheduleAt,
      repeatCron,
      tags,
      isRecurring,
      maxRetries,
      timeoutSec,
    } = req.body;
    const userId = req.user?.id;
    if (!script || !title) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    if (!userId) {
      res.status(401).json({
        error: "Unauthorized",
      });
      return;
    }

    console.log("Creating job with data:", req.body);

    // Create JobDefinition
    const jobDefinition = await db.jobDefinition.create({
      data: {
        title,
        description: description || "",
        script,
        env: env || {},
        userId: userId,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
        repeatCron: repeatCron || null,
        isRecurring: isRecurring || false,
        tags: tags || {},
        maxRetries: maxRetries || 3,
        timeoutSec: timeoutSec || null,
      },
    });

    if (!jobDefinition) {
      res.status(500).json({ message: "Failed to create job definition" });
      return;
    }

    // Schedule the job using BullMQ if scheduled or recurring
    if (scheduleAt || repeatCron || isRecurring) {
      const queueJobId = await JobScheduler.scheduleJob({
        jobDefinitionId: jobDefinition.id,
        agentId: agentId || undefined,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
        repeatCron: repeatCron || null,
        isRecurring: isRecurring || false,
      });
    } else {
      // Create a new JobExecution record
      const execution = await db.jobExecution.create({
        data: {
          jobId: jobDefinition.id,
          agentId: agentId || null,
          attempt: 1,
          status: "READY",
          scheduledAt: new Date(),
        },
      });
    }

    res.status(201).json({
      message: "Job created and scheduled successfully",
      jobId: jobDefinition.id,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Failed to create job" });
  }
};

const getJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        error: "Unauthorized",
      });
      return;
    }

    // Query JobExecutions with related JobDefinition and Agent
    const executions = await db.jobExecution.findMany({
      where: {
        job: {
          userId,
        },
      },
      include: {
        job: true,
        agent: {
          select: {
            id: true,
            hostname: true,
            os: true,
            arch: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ message: "Jobs Found", data: executions });
  } catch (error) {
    console.error("Error listing jobs:", error);
    res.status(500).json({ error: "Failed to list jobs" });
  }
};

const getJob = async (req: Request, res: Response) => {
  try {
    const executionId = req.params.jobId;

    // Fetch JobExecution with related data
    const execution = await db.jobExecution.findUnique({
      where: { id: executionId },
      include: {
        job: true,
        agent: {
          select: {
            id: true,
            hostname: true,
            os: true,
          },
        },
        logs: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!execution) {
      res.status(404).json({ message: "Job execution not found" });
      return;
    }

    res.status(200).json(execution);
  } catch (error) {
    console.error("Error getting job:", error);
    res.status(500).json({ error: "Failed to get job" });
  }
};

const updateJob = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId;
    const updateData = req.body;

    // Update JobDefinition
    await db.jobDefinition.update({
      where: { id: jobId },
      data: updateData,
    });

    res.status(200).json({ message: `Job ${jobId} updated successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to update job" });
  }
};

const deleteJob = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId;

    // Delete JobDefinition (will cascade to JobExecutions and Logs)
    await db.jobDefinition.delete({
      where: { id: jobId },
    });

    res.status(200).json({ message: `Job ${jobId} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete job" });
  }
};

const getJobExecutions = async (req: Request, res: Response) => {
  try {
    const jobDefinitionId = req.params.jobDefinitionId;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const executions = await db.jobExecution.findMany({
      where: {
        jobId: jobDefinitionId,
        job: { userId },
      },
      include: {
        agent: {
          select: { id: true, hostname: true, os: true, arch: true, isOnline: true, lastSeen: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ message: "Executions found", data: executions });
  } catch (error) {
    console.error("Error listing executions:", error);
    res.status(500).json({ error: "Failed to list executions" });
  }
};

const reRunJob = async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Look up the original execution to get the job definition
    const originalExecution = await db.jobExecution.findUnique({
      where: { id: executionId },
      include: { job: true },
    });

    if (!originalExecution) {
      res.status(404).json({ message: "Execution not found" });
      return;
    }
    if (originalExecution.job.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Count existing executions to determine next attempt number
    const attemptCount = await db.jobExecution.count({
      where: { jobId: originalExecution.jobId },
    });

    const newExecution = await db.jobExecution.create({
      data: {
        jobId: originalExecution.jobId,
        agentId: originalExecution.agentId || null,
        attempt: attemptCount + 1,
        status: "READY",
        scheduledAt: new Date(),
      },
    });

    res.status(201).json({
      message: "Job re-queued successfully",
      data: newExecution,
    });
  } catch (error) {
    console.error("Error re-running job:", error);
    res.status(500).json({ error: "Failed to re-run job" });
  }
};

const cancelJob = async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const execution = await db.jobExecution.findUnique({
      where: { id: executionId },
      include: { job: true },
    });

    if (!execution) {
      res.status(404).json({ message: "Execution not found" });
      return;
    }

    if (execution.job.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Update execution status
    await db.jobExecution.update({
      where: { id: executionId },
      data: { status: "CANCELLED" },
    });

    // If it's a recurring job, remove it from the scheduler
    if (execution.job.isRecurring) {
      await JobScheduler.removeRecurringJob(execution.job.id);
    }

    res.status(200).json({ message: "Job cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling job:", error);
    res.status(500).json({ error: "Failed to cancel job" });
  }
};

export const jobController = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  getJobExecutions,
  reRunJob,
  cancelJob,
};


