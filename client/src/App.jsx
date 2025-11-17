import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import Stakeholders from "./pages/Stakeholders";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import Pricing from "./pages/Pricing";
import Requirements from "./pages/Requirements";
import RequirementDetails from "./pages/RequirementDetails";

const App = () => {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="team" element={<Team />} />
          <Route path="stackholders" element={<Stakeholders />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projectsDetail" element={<ProjectDetails />} />
          <Route path="taskDetails" element={<TaskDetails />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="requirement-details" element={<RequirementDetails />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
