-- CreateTable
CREATE TABLE "nhi" (
    "nhiId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "nhiType" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "ownerId" TEXT,
    "ownerTeam" TEXT,
    "environment" TEXT NOT NULL,
    "privilegeLevel" TEXT NOT NULL,
    "breadthScore" INTEGER NOT NULL DEFAULT 0,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isHardcoded" BOOLEAN NOT NULL DEFAULT false,
    "vaultPath" TEXT,
    "rotationSchedule" TEXT,
    "certExpiry" TIMESTAMP(3),
    "lastDiscovered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceConnector" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "nhi_pkey" PRIMARY KEY ("nhiId")
);

-- CreateTable
CREATE TABLE "posture_issue" (
    "issueId" TEXT NOT NULL,
    "nhiId" TEXT NOT NULL,
    "nhiName" TEXT,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remediatedAt" TIMESTAMP(3),
    "remediatedBy" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "posture_issue_pkey" PRIMARY KEY ("issueId")
);

-- CreateTable
CREATE TABLE "alert" (
    "alertId" TEXT NOT NULL,
    "nhiId" TEXT NOT NULL,
    "nhiName" TEXT,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "itsmTicketId" TEXT,
    "forensicData" JSONB,
    "timeline" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "alert_pkey" PRIMARY KEY ("alertId")
);

-- CreateTable
CREATE TABLE "connector_config" (
    "connectorId" TEXT NOT NULL,
    "connectorType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "config" JSONB NOT NULL DEFAULT '{}',
    "lastTestAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_config_pkey" PRIMARY KEY ("connectorId")
);

-- CreateTable
CREATE TABLE "discovery_run" (
    "runId" TEXT NOT NULL,
    "connectorId" TEXT,
    "connectorType" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "nhisDiscovered" INTEGER NOT NULL DEFAULT 0,
    "nhisNew" INTEGER NOT NULL DEFAULT 0,
    "nhisUpdated" INTEGER NOT NULL DEFAULT 0,
    "nhisRemoved" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "triggeredBy" TEXT NOT NULL,

    CONSTRAINT "discovery_run_pkey" PRIMARY KEY ("runId")
);

-- CreateTable
CREATE TABLE "compliance_score" (
    "id" SERIAL NOT NULL,
    "framework" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "controls" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "failing" INTEGER NOT NULL,

    CONSTRAINT "compliance_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_campaign" (
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "nhiScope" JSONB NOT NULL DEFAULT '[]',
    "certifiers" JSONB NOT NULL DEFAULT '[]',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "decisions" INTEGER NOT NULL DEFAULT 0,
    "pending" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "certification_campaign_pkey" PRIMARY KEY ("campaignId")
);

-- CreateTable
CREATE TABLE "certification_decision" (
    "id" SERIAL NOT NULL,
    "campaignId" TEXT NOT NULL,
    "nhiId" TEXT NOT NULL,
    "certifierId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certification_decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "eventId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traceId" TEXT NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "policy" (
    "policyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "policy_pkey" PRIMARY KEY ("policyId")
);

-- CreateTable
CREATE TABLE "local_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "local_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nhi_status_idx" ON "nhi"("status");

-- CreateIndex
CREATE INDEX "nhi_riskLevel_idx" ON "nhi"("riskLevel");

-- CreateIndex
CREATE INDEX "nhi_environment_idx" ON "nhi"("environment");

-- CreateIndex
CREATE INDEX "posture_issue_status_idx" ON "posture_issue"("status");

-- CreateIndex
CREATE INDEX "posture_issue_nhiId_idx" ON "posture_issue"("nhiId");

-- CreateIndex
CREATE INDEX "alert_status_idx" ON "alert"("status");

-- CreateIndex
CREATE INDEX "alert_nhiId_idx" ON "alert"("nhiId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_score_framework_key" ON "compliance_score"("framework");

-- CreateIndex
CREATE INDEX "audit_log_resourceId_idx" ON "audit_log"("resourceId");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "local_user_email_key" ON "local_user"("email");

-- AddForeignKey
ALTER TABLE "posture_issue" ADD CONSTRAINT "posture_issue_nhiId_fkey" FOREIGN KEY ("nhiId") REFERENCES "nhi"("nhiId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_nhiId_fkey" FOREIGN KEY ("nhiId") REFERENCES "nhi"("nhiId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_run" ADD CONSTRAINT "discovery_run_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connector_config"("connectorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_decision" ADD CONSTRAINT "certification_decision_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "certification_campaign"("campaignId") ON DELETE CASCADE ON UPDATE CASCADE;
