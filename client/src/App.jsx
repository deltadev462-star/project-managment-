import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import Layout from "./pages/Layout";







const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const Team = lazy(() => import("./pages/Team"));
const Stakeholders = lazy(() => import("./pages/Stakeholders"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));
const Pricing = lazy(() => import("./pages/Pricing"));

 const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const App = () => {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="team"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Team />
              </Suspense>
            }
          />
          <Route
            path="stakeholders"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Stakeholders />
              </Suspense>
            }
          />
          <Route
            path="projects"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Projects />
              </Suspense>
            }
          />
          <Route
            path="projectsDetail"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ProjectDetails />
              </Suspense>
            }
          />
          <Route
            path="taskDetails"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <TaskDetails />
              </Suspense>
            }
          />
          <Route
            path="pricing"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Pricing />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </>
  );
};

export default App;
