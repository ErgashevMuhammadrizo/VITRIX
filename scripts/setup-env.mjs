import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (!existsSync(".env"))
  writeFileSync(
    ".env",
    readFileSync(".env.example", "utf8") +
      "\nPOSTGRES_PASSWORD=" +
      randomBytes(24).toString("hex") +
      "\n",
    { mode: 0o600 },
  );
if (!readFileSync(".env", "utf8").includes("POSTGRES_PASSWORD="))
  writeFileSync(
    ".env",
    readFileSync(".env", "utf8") +
      "\nPOSTGRES_PASSWORD=" +
      randomBytes(24).toString("hex") +
      "\n",
    { mode: 0o600 },
  );
if (!existsSync("backend/.env"))
  writeFileSync(
    "backend/.env",
    readFileSync("backend/.env.example", "utf8").replace(
      "replace-with-a-long-random-secret",
      randomBytes(48).toString("hex"),
    ),
    { mode: 0o600 },
  );
console.log(
  "Environment files are ready. Set Gmail SMTP credentials in backend/.env before registration. Existing files were preserved.",
);
