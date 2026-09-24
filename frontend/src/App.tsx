import { Routes, Route, Link } from "react-router-dom";
import AssessmentList from "./pages/assessments/AssessmentList";
import AssessmentCreate from "./pages/assessments/AssessmentCreate";
import AssessmentDetail from "./pages/assessments/AssessmentDetail";
import ScoreEntry from "./pages/assessments/ScoreEntry";
import BulkUpload from "./pages/assessments/BulkUpload";
import BatchList from "./pages/batches/BatchList";
import BatchCreate from "./pages/batches/BatchCreate";
import BatchDetail from "./pages/batches/BatchDetail";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold text-gray-800">
            EIP
          </Link>
          <Link to="/assessments" className="text-gray-600 hover:text-gray-900">
            Assessments
          </Link>
          <Link to="/batches" className="text-gray-600 hover:text-gray-900">
            Batches
          </Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<AssessmentList />} />
          <Route path="/assessments" element={<AssessmentList />} />
          <Route path="/assessments/create" element={<AssessmentCreate />} />
          <Route path="/assessments/:id/edit" element={<AssessmentCreate />} />
          <Route path="/assessments/:id" element={<AssessmentDetail />} />
          <Route path="/assessments/:id/scores" element={<ScoreEntry />} />
          <Route path="/assessments/:id/bulk-upload" element={<BulkUpload />} />
          <Route path="/batches" element={<BatchList />} />
          <Route path="/batches/create" element={<BatchCreate />} />
          <Route path="/batches/:id/edit" element={<BatchCreate />} />
          <Route path="/batches/:id" element={<BatchDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
