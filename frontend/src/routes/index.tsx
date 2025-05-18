import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import RunAgent from "../pages/RunAgent";
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
        path: "history",
        element: <Journaling />,
      },
    ],
  },
]);

export default router;
