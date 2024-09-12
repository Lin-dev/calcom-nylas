"use server";

import { parseWithZod } from "@conform-to/zod";
import prisma from "./lib/db";
import { requireUser } from "./lib/hooks";
import { onboardingSchema } from "./lib/zodSchemas";
import { redirect } from "next/navigation";

export async function onboardingAction(prevState: any, formData: FormData) {
  const session = await requireUser();
  const submission = await parseWithZod(formData, {
    // create the zod schema with `isEmailUnique()` implemented
    schema: onboardingSchema({
      async isUsernameUnique() {
        const exisitngSubDirectory = await prisma.user.findUnique({
          where: {
            username: formData.get("username") as string,
          },
        });
        return !exisitngSubDirectory;
      },
    }),

    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const user = await prisma.user.update({
    where: {
      email: session.email as string,
    },
    data: {
      username: submission.value.username,
      fullName: submission.value.fullName,
      description: submission.value.description,
    },
  });

  return redirect("/dashboard");
}