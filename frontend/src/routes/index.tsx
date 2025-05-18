import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import RunAgent from "../pages/RunAgent";
import History from "../pages/History";
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
        element: <History />,
      },
    ],
  },
]);

export default router;
