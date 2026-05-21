import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Sign_up from "../pages/auth/Sign_up.jsx";
import Sign_in from "../pages/auth/Sign_in.jsx";
import Layout from "../layouts/Layout.jsx";
import ChatService from "../services/chat.service.jsx";
// import GroupChatPage from "../services/GroupChatPage.service.jsx";

const App = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Sign_in />} />
      <Route path="/sign_up" element={<Sign_up />} />
      <Route path="/layout" element={<Layout />}>
        <Route path="chat/:userName" element={<ChatService />} />
        {/* <Route path="groupChat/:groupName" element={<GroupChatPage />} /> */}
      </Route>
    </>,
  ),
);

export default App;
