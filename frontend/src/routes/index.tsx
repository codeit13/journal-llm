import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import RunAgent from "../pages/RunAgent";
import AgentHistory from "../pages/AgentHistory";
import Journaling from "../pages/Journaling";
import NotFound from "../pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <RunAgent />,
      },
      {
        path: "journal",
        element: <Journaling />,
      },
      {
        path: "history",
        element: <AgentHistory />,
      },
    ],
  },
]);

export default router;
