import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Sign_up from "./components/Sign_up.jsx";
import Sign_in from "./components/Sign_in.jsx";
import Layout from "./components/Layout.jsx";
import ChatPage from "./services/chat.service.jsx";
import GroupChatPage from "./services/GroupChatPage.service.jsx";

const App = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Sign_up />} />
      <Route path="/sign_in" element={<Sign_in />} />
      <Route path="/layout" element={<Layout />}>
        <Route path="chat/:userName" element={<ChatPage />} />
        <Route path="groupChat/:groupName" element={<GroupChatPage />} />
      </Route>
    </>,
  ),
);

export default App;
