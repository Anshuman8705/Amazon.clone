import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import Toast from "./Toast.jsx";

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <Toast />
    </div>
  );
}
