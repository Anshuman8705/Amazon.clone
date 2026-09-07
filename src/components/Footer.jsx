import { Link } from "react-router-dom";

const logo = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/images/logo.png`;

const columns = [
  { head: "Get to know us", links: ["Careers", "Blog", "About NimbusMart", "Investor relations"] },
  { head: "Make money with us", links: ["Sell on NimbusMart", "Become an affiliate", "Advertise your products", "Self-publish with us"] },
  { head: "Payment products", links: ["Business card", "Shop with points", "Reload your balance", "Currency converter"] },
  { head: "Let us help you", links: ["Your account", "Your orders", "Shipping rates", "Returns and replacements"] },
];

export default function Footer() {
  return (
    <footer className="mt-8">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-full bg-slate-hi py-4 text-sm text-white hover:bg-slate"
      >
        Back to top
      </button>
      <div className="bg-slate px-6 py-10">
        <div className="mx-auto grid max-w-screen-lg gap-8 grid-cols-2 lg:grid-cols-4">
          {columns.map((c) => (
            <div key={c.head}>
              <p className="mb-2 font-bold text-white">{c.head}</p>
              <ul className="space-y-1">
                {c.links.map((l) => (
                  <li key={l}>
                    <Link to={l === "Your orders" ? "/orders" : l === "Your account" ? "/account" : "/products"} className="text-sm text-gray-300 hover:underline">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-hi bg-slate px-6 py-5">
        <div className="mx-auto flex max-w-screen-lg flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <img src={logo} alt="NimbusMart" className="h-6 w-auto" />
          <span className="rounded border border-gray-500 px-3 py-1 text-xs text-gray-300">English</span>
          <span className="rounded border border-gray-500 px-3 py-1 text-xs text-gray-300">$ USD</span>
          <span className="rounded border border-gray-500 px-3 py-1 text-xs text-gray-300">India</span>
        </div>
      </div>
      <div className="bg-navy px-6 py-6 text-center">
        <div className="mb-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-300">
          <Link to="/products" className="hover:underline">Conditions of use</Link>
          <Link to="/products" className="hover:underline">Privacy notice</Link>
          <Link to="/account" className="hover:underline">Your account</Link>
          <a href="https://github.com/Anshuman8705/Amazon.clone" className="hover:underline" target="_blank" rel="noopener noreferrer">Source on GitHub</a>
        </div>
        <p className="text-xs text-gray-400">
          NimbusMart is a student project for a web technology course, not a real shop. It is not affiliated with any retailer. No payment is ever taken.
        </p>
        <p className="mt-1 text-xs text-gray-400">Designed and built by Anshuman Agrawal</p>
      </div>
    </footer>
  );
}
