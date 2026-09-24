import {
  createAssessmentSchema,
  updateAssessmentSchema,
  addSectionSchema,
  addQuestionSchema,
  submitScoresSchema,
} from "../validators/assessments.validator";

describe("Assessment Validators", () => {
  describe("createAssessmentSchema", () => {
    const validBase = {
      batchId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      title: "Midterm Exam",
      type: "QUIZ",
      assessmentDate: "2026-10-01T10:00:00Z",
    };

    it("should accept valid assessment without sections", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        maxScore: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid assessment with sections and questions", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        sections: [
          {
            title: "Aptitude",
            weightage: 40,
            questions: [
              { label: "Q1", maxScore: 10 },
              { label: "Q2", maxScore: 15 },
            ],
          },
          {
            title: "Technical",
            weightage: 60,
            questions: [{ label: "Q1", maxScore: 25 }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid batchId", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        batchId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid type", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        type: "INVALID_TYPE",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid date", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        assessmentDate: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("should reject partial weightage (some sections have it, some don't)", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        sections: [
          {
            title: "Section A",
            weightage: 50,
            questions: [{ label: "Q1", maxScore: 10 }],
          },
          {
            title: "Section B",
            questions: [{ label: "Q1", maxScore: 10 }],
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.map((i) => i.message).join(" ");
        expect(msg).toContain("weightage");
      }
    });

    it("should reject weightages that don't total 100%", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        sections: [
          {
            title: "Section A",
            weightage: 50,
            questions: [{ label: "Q1", maxScore: 10 }],
          },
          {
            title: "Section B",
            weightage: 30,
            questions: [{ label: "Q1", maxScore: 10 }],
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.map((i) => i.message).join(" ");
        expect(msg).toContain("100%");
      }
    });

    it("should accept weightages totaling exactly 100%", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        sections: [
          {
            title: "Section A",
            weightage: 60,
            questions: [{ label: "Q1", maxScore: 10 }],
          },
          {
            title: "Section B",
            weightage: 40,
            questions: [{ label: "Q1", maxScore: 15 }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept sections without weightage (all omitted)", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        sections: [
          {
            title: "Section A",
            questions: [{ label: "Q1", maxScore: 10 }],
          },
          {
            title: "Section B",
            questions: [{ label: "Q1", maxScore: 20 }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject section with no questions", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        sections: [
          {
            title: "Section A",
            questions: [],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject question with zero maxScore", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        sections: [
          {
            title: "Section A",
            questions: [{ label: "Q1", maxScore: 0 }],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject question with negative maxScore", () => {
      const result = createAssessmentSchema.safeParse({
        ...validBase,
        sections: [
          {
            title: "Section A",
            questions: [{ label: "Q1", maxScore: -5 }],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should accept all four assessment types", () => {
      for (const type of ["CODING_TEST", "QUIZ", "ASSIGNMENT", "CONTEST"]) {
        const result = createAssessmentSchema.safeParse({
          ...validBase,
          type,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateAssessmentSchema", () => {
    it("should accept partial update with title only", () => {
      const result = updateAssessmentSchema.safeParse({ title: "Updated Title" });
      expect(result.success).toBe(true);
    });

    it("should accept empty object (no fields updated)", () => {
      const result = updateAssessmentSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should reject empty title string", () => {
      const result = updateAssessmentSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("addSectionSchema", () => {
    it("should accept valid section", () => {
      const result = addSectionSchema.safeParse({ title: "New Section" });
      expect(result.success).toBe(true);
    });

    it("should accept section with weightage", () => {
      const result = addSectionSchema.safeParse({
        title: "New Section",
        weightage: 50,
        sortOrder: 1,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const result = addSectionSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });

    it("should reject weightage over 100", () => {
      const result = addSectionSchema.safeParse({
        title: "Section",
        weightage: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addQuestionSchema", () => {
    it("should accept valid question", () => {
      const result = addQuestionSchema.safeParse({ label: "Q1", maxScore: 10 });
      expect(result.success).toBe(true);
    });

    it("should reject missing label", () => {
      const result = addQuestionSchema.safeParse({ maxScore: 10 });
      expect(result.success).toBe(false);
    });

    it("should reject zero maxScore", () => {
      const result = addQuestionSchema.safeParse({ label: "Q1", maxScore: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("submitScoresSchema", () => {
    it("should accept valid score submission", () => {
      const result = submitScoresSchema.safeParse({
        studentId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        questionScores: [
          {
            questionId: "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            score: 8,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative score", () => {
      const result = submitScoresSchema.safeParse({
        studentId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        questionScores: [
          {
            questionId: "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            score: -5,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid studentId", () => {
      const result = submitScoresSchema.safeParse({
        studentId: "not-uuid",
        questionScores: [
          {
            questionId: "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            score: 10,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty questionScores array", () => {
      const result = submitScoresSchema.safeParse({
        studentId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        questionScores: [],
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional remarks", () => {
      const result = submitScoresSchema.safeParse({
        studentId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        questionScores: [
          { questionId: "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", score: 10 },
        ],
        remarks: "Good performance",
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("maxScore auto-calculation logic", () => {
  it("should calculate maxScore as sum of all question maxScores", () => {
    const sections = [
      { questions: [{ maxScore: 10 }, { maxScore: 15 }] },
      { questions: [{ maxScore: 25 }, { maxScore: 20 }] },
    ];
    const totalMax = sections.reduce(
      (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.maxScore, 0),
      0
    );
    expect(totalMax).toBe(70);
  });

  it("should be 0 when no sections exist", () => {
    const sections: { questions: { maxScore: number }[] }[] = [];
    const totalMax = sections.reduce(
      (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.maxScore, 0),
      0
    );
    expect(totalMax).toBe(0);
  });
});

describe("Score calculation logic", () => {
  function calculateOverall(
    sections: {
      weightage: number | null;
      questions: { maxScore: number; score: number }[];
    }[]
  ) {
    const hasWeightage = sections.every((s) => s.weightage !== null);

    if (hasWeightage) {
      let weightedTotal = 0;
      for (const section of sections) {
        const sectionMax = section.questions.reduce((sum, q) => sum + q.maxScore, 0);
        const sectionScore = section.questions.reduce((sum, q) => sum + q.score, 0);
        if (sectionMax > 0) {
          weightedTotal += (sectionScore / sectionMax) * (section.weightage as number);
        }
      }
      return Math.round(weightedTotal * 100) / 100;
    }

    return sections.reduce(
      (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.score, 0),
      0
    );
  }

  it("should calculate raw total when no weightage", () => {
    const sections = [
      {
        weightage: null,
        questions: [
          { maxScore: 10, score: 8 },
          { maxScore: 20, score: 15 },
        ],
      },
      {
        weightage: null,
        questions: [{ maxScore: 30, score: 25 }],
      },
    ];
    expect(calculateOverall(sections)).toBe(48);
  });

  it("should calculate weighted score out of 100 when weightage is set", () => {
    const sections = [
      {
        weightage: 40,
        questions: [
          { maxScore: 10, score: 10 },
          { maxScore: 10, score: 10 },
        ],
      },
      {
        weightage: 60,
        questions: [
          { maxScore: 50, score: 25 },
        ],
      },
    ];
    // Section A: (20/20) * 40 = 40
    // Section B: (25/50) * 60 = 30
    // Total = 70 out of 100
    expect(calculateOverall(sections)).toBe(70);
  });

  it("should handle partial scores with weightage", () => {
    const sections = [
      {
        weightage: 30,
        questions: [{ maxScore: 100, score: 50 }],
      },
      {
        weightage: 70,
        questions: [{ maxScore: 100, score: 80 }],
      },
    ];
    // Section A: (50/100) * 30 = 15
    // Section B: (80/100) * 70 = 56
    // Total = 71 out of 100
    expect(calculateOverall(sections)).toBe(71);
  });

  it("should return 0 for empty sections", () => {
    expect(calculateOverall([])).toBe(0);
  });

  it("should handle zero maxScore section gracefully", () => {
    const sections = [
      {
        weightage: 100,
        questions: [] as { maxScore: number; score: number }[],
      },
    ];
    expect(calculateOverall(sections)).toBe(0);
  });
});

describe("CSV parsing validation", () => {
  it("should identify required headers (case-insensitive)", () => {
    const headers = ["StudentID", "QuestionID", "Score"];
    const normalized = headers.map((h) => h.toLowerCase());
    const required = ["studentid", "questionid", "score"];
    const missing = required.filter((h) => !normalized.includes(h));
    expect(missing).toHaveLength(0);
  });

  it("should detect missing headers", () => {
    const headers = ["StudentID", "Score"];
    const normalized = headers.map((h) => h.toLowerCase());
    const required = ["studentid", "questionid", "score"];
    const missing = required.filter((h) => !normalized.includes(h));
    expect(missing).toContain("questionid");
  });

  it("should handle case-insensitive header matching", () => {
    const headers = ["STUDENTID", "questionId", "SCORE"];
    const normalized = headers.map((h) => h.toLowerCase());
    const required = ["studentid", "questionid", "score"];
    const missing = required.filter((h) => !normalized.includes(h));
    expect(missing).toHaveLength(0);
  });
});

describe("Weightage validation", () => {
  it("should detect when not all sections have weightage", () => {
    const sections = [
      { weightage: 50 },
      { weightage: undefined },
    ];
    const hasWeightage = sections.some((s) => s.weightage !== undefined);
    const allHaveWeightage = sections.every((s) => s.weightage !== undefined);
    expect(hasWeightage).toBe(true);
    expect(allHaveWeightage).toBe(false);
  });

  it("should validate weightage sum equals 100", () => {
    const sections = [
      { weightage: 40 },
      { weightage: 60 },
    ];
    const total = sections.reduce((sum, s) => sum + (s.weightage ?? 0), 0);
    expect(Math.abs(total - 100) < 0.01).toBe(true);
  });

  it("should reject weightage sum not equal to 100", () => {
    const sections = [
      { weightage: 40 },
      { weightage: 40 },
    ];
    const total = sections.reduce((sum, s) => sum + (s.weightage ?? 0), 0);
    expect(Math.abs(total - 100) < 0.01).toBe(false);
  });
});
