const appUrl = process.env.APP_URL;
const secret = process.env.CRON_SECRET;

if (!appUrl || !secret) {
  throw new Error("APP_URL and CRON_SECRET are required");
}

const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/jobs/discover`, {
  method: "POST",
  headers: {
    "x-cron-secret": secret,
  },
});

const body = await response.text();
console.log(body);

if (!response.ok) {
  process.exitCode = 1;
}
