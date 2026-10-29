import fs from "fs-extra";
import path from "path";
import { __dirname } from "../utils/index.js";

// Mango the site cat: a small decorative cursor-watching orange tabby
// (ui/mango.html). Main pages inject this include just before </body>;
// the menu opts out via generateCompletePage's skipMango, and the album
// tracker / unbuilt pages never call these builders at all.
let mangoCatInclude = null;

/** Returns the mango cat HTML include for injection before </body>. */
export function getMangoCatInclude() {
  if (mangoCatInclude === null) {
    mangoCatInclude = fs.readFileSync(
      path.join(__dirname, "../ui/mango.html"),
      "utf-8"
    );
  }
  return mangoCatInclude;
}
