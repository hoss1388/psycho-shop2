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

  // =========================
  // STARS
  // =========================
  // به Stars دست نمی‌زنیم
  stars: {
    tonPerStar: 0
  },

  // =========================
  // PREMIUM
  // =========================
  premium: {
    single: {},
    four: {}
  }
};


// ======================================================
// STARS
// همان سیستم قبلی
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
// گرفتن قیمت زنده از Fragment
// ======================================================

function getPremiumPrice(months) {

  const url =
    `https://api.fragment-api.io/api/prices` +
    `?product_type=premium` +
    `&quantity=${months}` +
    `&payment_method=ton` +
    `&recipient=durov`;

  try {

    const result = execFileSync(
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

    const data = JSON.parse(result);

    if (!data || typeof data.total !== "number") {
      console.error(
        `Invalid Premium response for ${months} months:`,
        data
      );

      process.exit(1);
    }

    console.log(
      `Premium ${months} months:`,
      `price=${data.price}`,
      `gas=${data.gas_fee}`,
      `total=${data.total}`,
      data.currency
    );

    // total همان مبلغ نهایی پرداختی است
    return data.total;

  } catch (error) {

    console.error(
      `Failed to get Premium price for ${months} months`
    );

    console.error(error.message);

    process.exit(1);
  }
}


// ======================================================
// گرفتن هر سه Premium
// ======================================================

const premium3m = getPremiumPrice(3);
const premium6m = getPremiumPrice(6);
const premium12m = getPremiumPrice(12);


// ======================================================
// ذخیره قیمت خام Fragment
// سود بعداً در pricing.js اضافه می‌شود
// ======================================================

output.premium.single["3m"] = premium3m;
output.premium.single["6m"] = premium6m;
output.premium.single["12m"] = premium12m;

output.premium.four["3m"] = premium3m;
output.premium.four["6m"] = premium6m;
output.premium.four["12m"] = premium12m;


// ======================================================
// نمایش برای بررسی
// ======================================================

console.log("");
console.log("===== FINAL PREMIUM PRICES =====");

console.log(
  "3 months:",
  output.premium.single["3m"],
  "TON"
);

console.log(
  "6 months:",
  output.premium.single["6m"],
  "TON"
);

console.log(
  "12 months:",
  output.premium.single["12m"],
  "TON"
);

console.log("===============================");
console.log("");


// ======================================================
// ذخیره prices.json
// ======================================================

fs.writeFileSync(
  pricesFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log("Prices converted successfully");
