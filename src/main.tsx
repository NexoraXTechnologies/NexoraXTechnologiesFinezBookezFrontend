import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider, useSelector } from "react-redux";
import { store } from "./redux/store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
// import { initOneSignal } from "./onesignal/oneSignalClient";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const OneSignalWrapper = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const professionalUser = JSON.parse(localStorage.getItem("professionalUser"));
    const loginId = professionalUser?.userEmail || user?.email || null;
    console.log("🟦 OneSignalWrapper → loginId:", loginId);
    // initOneSignal(loginId); 
  }, [user]);

  return <App />;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={clientId}>
      <Provider store={store}>
        <OneSignalWrapper />
      </Provider>
    </GoogleOAuthProvider>
  </BrowserRouter>
);