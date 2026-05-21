import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import App from "../routes/AppRoutes.jsx";
import "../App.css"
import { Provider } from "react-redux";
import { store } from "./store.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <RouterProvider router={App} />
  </Provider>
);
