import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

export default function NotFoundPage({ message = "That page does not exist." }) {
  return (
    <main className="mx-auto max-w-screen-md px-3 py-16 text-center">
      <p className="text-6xl font-bold text-ink">404</p>
      <p className="mt-2 text-lg text-ink">{message}</p>
      <Link to="/"><Button variant="ghost" className="mt-6">Go to the home page</Button></Link>
    </main>
  );
}
