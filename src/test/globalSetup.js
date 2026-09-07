// Starts a real API on a fixed port with a throwaway database so the
// front-end tests exercise genuine HTTP calls rather than mocks.
import { createApp } from "../../server/app.js";

export default async function setup() {
  const app = createApp({ dbPath: ":memory:", serveClient: false });
  const server = await new Promise((resolve) => {
    const s = app.listen(4999, "127.0.0.1", () => resolve(s));
  });
  return () => new Promise((resolve) => server.close(resolve));
}
