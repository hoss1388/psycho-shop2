const fs = require("fs");
const { execFileSync } = require("child_process");

const pricesFile = "./api/prices.json";

const tonPrice = Number(process.env.TON_PRICE || 0);

if (!tonPrice) {
  console.error("TON price is missing");
  process.exit(1);
}

// ------------------------------------------------------
// Fragment price list
// ------------------------------------------------------

const fragmentData = JSON.parse(
  fs.readFileSync(pricesFile, "utf8")
);

const output = {
  tonToToman: tonPrice,

  // =========================
  // STARS
  // =========================

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
// ======================================================

// قیمت 50 Stars از لیست Fragment گرفته می‌شود.

const stars50 = fragmentData.find(
  x =>
    x.product_type === "stars" &&
    String(x.item_name).includes("50") &&
    x.currency === "TON"
);

if (stars50) {
  output.stars.tonPerStar =
    Number(stars50.price) / 50;
}


// ======================================================
// PREMIUM
// ======================================================

// Premium را مستقیماً از Live API فرگمنت می‌گیریم.
//
// 3 ماه
// 6 ماه
// 12 ماه

function getPremiumPrice(months) {

  console.log(`Requesting Premium: ${months} months`);

  const url =
    `https://api.fragment-api.io/api/prices` +
    `?product_type=premium` +
    `&quantity=${months}` +
    `&recipient=durov` +
    `&payment_method=ton`;

  try {

    const result = execFileSync(
      "curl",
      [
        "-fsS",
        url,
        "-H",
        `X-API-Key: ${process.env.FRAGMENT_API_KEY}`
      ],
      {
        encoding: "utf8"
      }
    );

    const data = JSON.parse(result);

    console.log(
      `Fragment Premium ${months}m:`,
      data
    );

    // ----------------------------------------
    // حالت اول: API قیمت را در price برگرداند
    // ----------------------------------------

    if (
      data &&
      typeof data.price === "number"
    ) {
      return data.price;
    }

    // ----------------------------------------
    // حالت دوم: API قیمت را در total برگرداند
    // ----------------------------------------

    if (
      data &&
      typeof data.total === "number"
    ) {
      return data.total;
    }

    throw new Error(
      `No price found in Fragment response for ${months} months`
    );

  } catch (error) {

    console.error(
      `Failed to get Premium price for ${months} months`
    );

    console.error(error.message);

    process.exit(1);
  }
}


// ======================================================
// GET LIVE PREMIUM PRICES
// ======================================================

const premium3 = getPremiumPrice(3);
const premium6 = getPremiumPrice(6);
const premium12 = getPremiumPrice(12);


// ======================================================
// SAVE PREMIUM RAW TON PRICES
// ======================================================

// Single Premium

output.premium.single["3m"] = premium3;
output.premium.single["6m"] = premium6;
output.premium.single["12m"] = premium12;


// ======================================================
// FOUR PREMIUM
// ======================================================

// قیمت پایه برای 4 بوست/چهار Premium
// همان قیمت پایه Fragment است.
//
// سود مربوط به 4 عدد در pricing.js
// جداگانه اضافه خواهد شد.

output.premium.four["3m"] = premium3;
output.premium.four["6m"] = premium6;
output.premium.four["12m"] = premium12;


// ======================================================
// DEBUG
// ======================================================

console.log("");
console.log("===== FINAL PREMIUM PRICES =====");

console.log(
  "3m:",
  output.premium.single["3m"],
  "TON"
);

console.log(
  "6m:",
  output.premium.single["6m"],
  "TON"
);

console.log(
  "12m:",
  output.premium.single["12m"],
  "TON"
);

console.log("===============================");
console.log("");


// ======================================================
// DEBUG STARS
// ======================================================

console.log("===== FINAL STARS PRICE =====");

console.log(
  "TON per Star:",
  output.stars.tonPerStar
);

console.log("============================");
console.log("");


// ======================================================
// SAVE
// ======================================================

fs.writeFileSync(
  pricesFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log("Prices converted successfully");
