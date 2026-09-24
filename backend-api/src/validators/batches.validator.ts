import { z } from "zod";

export const createBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  department: z.string().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "startDate must be a valid ISO datetime",
  }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "endDate must be a valid ISO datetime",
    })
    .optional(),
  description: z.string().optional(),
});

export const updateBatchSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "startDate must be a valid ISO datetime",
    })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "endDate must be a valid ISO datetime",
    })
    .optional(),
  description: z.string().optional(),
});

export const assignStudentSchema = z.object({
  studentId: z.string().uuid("studentId must be a valid UUID"),
});

export const assignTrainerSchema = z.object({
  trainerId: z.string().uuid("trainerId must be a valid UUID"),
});

export const createSessionSchema = z
  .object({
    trainerId: z.string().uuid("trainerId must be a valid UUID"),
    title: z.string().min(1, "Session title is required"),
    topic: z.string().optional(),
    scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "scheduledDate must be a valid ISO datetime",
    }),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "startTime must be a valid ISO datetime",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "endTime must be a valid ISO datetime",
    }),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const updateSessionSchema = z
  .object({
    trainerId: z.string().uuid("trainerId must be a valid UUID").optional(),
    title: z.string().min(1).optional(),
    topic: z.string().optional(),
    scheduledDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "scheduledDate must be a valid ISO datetime",
      })
      .optional(),
    startTime: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "startTime must be a valid ISO datetime",
      })
      .optional(),
    endTime: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "endTime must be a valid ISO datetime",
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: "endTime must be after startTime",
      path: ["endTime"],
    }
  );
