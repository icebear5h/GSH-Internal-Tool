-- Add Task table to existing schema
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_completed_idx" ON "Task"("completed");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
