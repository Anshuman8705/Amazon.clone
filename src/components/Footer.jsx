import { Link } from "react-router-dom";

const logo = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/images/logo.png`;

const columns = [
  { head: "Get to know us", links: ["Careers", "Blog", "About Amazon", "Investor relations"] },
  { head: "Make money with us", links: ["Sell on Amazon", "Become an affiliate", "Advertise your products", "Self-publish with us"] },
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
        <div className="mx-auto grid max-w-screen-lg gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="bg-navy px-6 py-6 text-center">
        <img src={logo} alt="amazon" className="mx-auto h-6 w-auto" />
        <p className="mt-3 text-xs text-gray-400">
          Student project for a web technology course. Not affiliated with Amazon.com, Inc. No real orders are placed.
        </p>
        <p className="mt-1 text-xs text-gray-400">Designed and built by Anshuman Agrawal</p>
      </div>
    </footer>
  );
}
