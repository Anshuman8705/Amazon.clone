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
      <p className="bg-amber-100 px-3 py-1 text-center text-xs text-ink" role="note">
        NimbusMart is a student demo store. Nothing is sold and no card is ever charged. Use the test card 4242 4242 4242 4242 at checkout.
      </p>
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <Toast />
    </div>
  );
}
