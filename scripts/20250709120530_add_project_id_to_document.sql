-- Add projectId column to Document table
ALTER TABLE "Document" ADD COLUMN "projectId" TEXT;

-- Add foreign key constraint to link Document to Project
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");
