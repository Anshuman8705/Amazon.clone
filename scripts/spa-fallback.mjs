// GitHub Pages serves 404.html for unknown paths. Copying index.html there
// lets React Router handle deep links such as /product/3 after a refresh.
import { copyFileSync, existsSync } from "node:fs";

if (existsSync("dist/index.html")) {
  copyFileSync("dist/index.html", "dist/404.html");
  console.log("Wrote dist/404.html for client-side routing.");
}
