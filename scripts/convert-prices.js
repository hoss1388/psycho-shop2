const fs = require("fs");
const { execFileSync } = require("child_process");

const pricesFile = "./api/prices.json";

const tonPrice = Number(process.env.TON_PRICE || 0);
const apiKey = process.env.FRAGMENT_API_KEY;

if (!tonPrice) {
  console.error("TON price is missing");
  process.exit(1);
}

if (!apiKey) {
  console.error("FRAGMENT_API_KEY is missing");
  process.exit(1);
}

const fragmentData = JSON.parse(
  fs.readFileSync(pricesFile, "utf8")
);

const output = {
  tonToToman: tonPrice,

  stars: {
    tonPerStar: 0
  },

  premium: {
    single: {},
    four: {}
  }
};


// ======================================================
// STARS
// ======================================================
// این بخش را دست نمی‌زنیم
// ======================================================

const stars50 = fragmentData.find(
  x =>
    x.product_type === "stars" &&
    x.item_name.includes("50") &&
    x.currency === "TON"
);

if (stars50) {
  output.stars.tonPerStar = stars50.price / 50;
}


// ======================================================
// PREMIUM
// ======================================================

function getPremiumPrice(months) {

  const url =
    "https://api.fragment-api.io/api/prices" +
    `?product_type=premium` +
    `&quantity=${months}` +
    `&recipient=durov` +
    `&payment_method=ton`;

  console.log("");
  console.log("Requesting Premium:", months, "months");

  try {

    const response = execFileSync(
      "curl",
      [
        "-fsS",
        url,
        "-H",
        `X-API-Key: ${apiKey}`
      ],
      {
        encoding: "utf8"
      }
    );

    console.log("Fragment response:");
    console.log(response);

    const data = JSON.parse(response);

    if (typeof data.total !== "number") {
      console.error(
        "Invalid Premium response:",
        data
      );
      process.exit(1);
    }

    return data.total;

  } catch (error) {

    console.error(
      "Failed to get Premium price for",
      months,
      "months"
    );

    console.error(error.message);

    process.exit(1);
  }
}


// ======================================================
// GET LIVE PREMIUM PRICES
// ======================================================

const premium3m = getPremiumPrice(3);
const premium6m = getPremiumPrice(6);
const premium12m = getPremiumPrice(12);


// ======================================================
// SAVE RAW FRAGMENT PRICES
// ======================================================

output.premium.single["3m"] = premium3m;
output.premium.single["6m"] = premium6m;
output.premium.single["12m"] = premium12m;

output.premium.four["3m"] = premium3m;
output.premium.four["6m"] = premium6m;
output.premium.four["12m"] = premium12m;


// ======================================================
// DEBUG
// ======================================================

console.log("");
console.log("===== FINAL PREMIUM PRICES =====");

console.log("3m:", premium3m, "TON");
console.log("6m:", premium6m, "TON");
console.log("12m:", premium12m, "TON");

console.log("===============================");


// ======================================================
// SAVE
// ======================================================

fs.writeFileSync(
  pricesFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log("Prices converted successfully");
