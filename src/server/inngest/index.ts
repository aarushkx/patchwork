export { inngest } from "@/server/inngest/client";
export { reviewPr } from "@/server/inngest/functions/review-pr";

import { reviewPr } from "@/server/inngest/functions/review-pr";

export const functions = [reviewPr];
