import { z } from "zod";

const questionSchema = z.object({
  label: z.string().min(1, "Question label is required"),
  maxScore: z.number().positive("maxScore must be positive"),
  sortOrder: z.number().int().optional(),
});

const sectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  sortOrder: z.number().int().optional(),
  weightage: z.number().min(0).max(100).optional(),
  questions: z.array(questionSchema).min(1, "Each section must have at least one question"),
});

export const createAssessmentSchema = z
  .object({
    batchId: z.string().uuid("batchId must be a valid UUID"),
    title: z.string().min(1, "Title is required"),
    type: z.enum(["CODING_TEST", "QUIZ", "ASSIGNMENT", "CONTEST"]),
    assessmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "assessmentDate must be a valid ISO datetime",
    }),
    maxScore: z.number().positive().optional(),
    sections: z.array(sectionSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sections && data.sections.length > 0) {
      const hasWeightage = data.sections.some((s) => s.weightage !== undefined);
      const allHaveWeightage = data.sections.every((s) => s.weightage !== undefined);

      if (hasWeightage && !allHaveWeightage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "If any section has weightage, all sections must have weightage",
          path: ["sections"],
        });
        return;
      }

      if (hasWeightage && allHaveWeightage) {
        const total = data.sections.reduce((sum, s) => sum + (s.weightage ?? 0), 0);
        if (Math.abs(total - 100) > 0.01) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Section weightages must total exactly 100%. Current total: ${total}%`,
            path: ["sections"],
          });
        }
      }
    }
  });

export const updateAssessmentSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["CODING_TEST", "QUIZ", "ASSIGNMENT", "CONTEST"]).optional(),
  assessmentDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "assessmentDate must be a valid ISO datetime",
    })
    .optional(),
});

export const addSectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  sortOrder: z.number().int().optional(),
  weightage: z.number().min(0).max(100).optional(),
});

export const updateSectionSchema = z.object({
  title: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  weightage: z.number().min(0).max(100).optional(),
});

export const addQuestionSchema = z.object({
  label: z.string().min(1, "Question label is required"),
  maxScore: z.number().positive("maxScore must be positive"),
  sortOrder: z.number().int().optional(),
});

export const updateQuestionSchema = z.object({
  label: z.string().min(1).optional(),
  maxScore: z.number().positive().optional(),
  sortOrder: z.number().int().optional(),
});

export const submitScoresSchema = z.object({
  studentId: z.string().uuid("studentId must be a valid UUID"),
  questionScores: z
    .array(
      z.object({
        questionId: z.string().uuid("questionId must be a valid UUID"),
        score: z.number().min(0, "Score cannot be negative"),
      })
    )
    .min(1, "At least one question score is required"),
  remarks: z.string().optional(),
});
