CREATE TYPE "ReviewStatus" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" text NOT NULL,
	"githubId" integer NOT NULL UNIQUE,
	"name" text NOT NULL,
	"fullName" text NOT NULL,
	"private" boolean DEFAULT false NOT NULL,
	"htmlUrl" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"repositoryId" uuid NOT NULL,
	"userId" text NOT NULL,
	"prNumber" integer NOT NULL,
	"prTitle" text NOT NULL,
	"prUrl" text NOT NULL,
	"status" "ReviewStatus" DEFAULT 'PENDING'::"ReviewStatus" NOT NULL,
	"summary" text,
	"riskScore" integer,
	"comments" jsonb,
	"error" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "review_repositoryId_idx" ON "review" ("repositoryId");--> statement-breakpoint
CREATE INDEX "review_userId_idx" ON "review" ("userId");--> statement-breakpoint
CREATE INDEX "review_status_idx" ON "review" ("status");--> statement-breakpoint
ALTER TABLE "repository" ADD CONSTRAINT "repository_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_repositoryId_repository_id_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;