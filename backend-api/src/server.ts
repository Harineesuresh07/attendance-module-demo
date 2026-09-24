import express from "express";
import cors from "cors";
import assessmentRoutes from "./routes/assessments.routes";
import batchRoutes from "./routes/batches.routes";
import sessionRoutes from "./routes/sessions.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

// TODO: Add Module 2 auth middleware when ready

app.use("/api/assessments", assessmentRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
