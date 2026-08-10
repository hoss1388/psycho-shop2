const fs = require("fs");

const pricesFile = "./api/prices.json";

const tonPrice = Number(process.env.TON_PRICE || 0);

if (!tonPrice) {
  console.error("TON price is missing");
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
// فقط اطلاعات Premium با currency = TON
// مستقیماً از Fragment
// ======================================================

const premiumItems = fragmentData.filter(
  x =>
    x.product_type === "premium" &&
    x.currency === "TON"
);

premiumItems.forEach(item => {

  const name = String(item.item_name).toLowerCase();

  let plan = null;

  if (name.includes("3 months")) {
    plan = "3m";
  } 
  else if (name.includes("6 months")) {
    plan = "6m";
  } 
  else if (name.includes("12 months")) {
    plan = "12m";
  }

  if (!plan) return;

  // قیمت خام Fragment
  output.premium.single[plan] = item.price;

  // قیمت خام چهار بوست
  // سود در pricing.js محاسبه می‌شود
  output.premium.four[plan] = item.price;
});


// ======================================================
// بررسی اینکه قیمت‌های Premium دریافت شده‌اند
// ======================================================

console.log("===== PREMIUM PRICES =====");

console.log(
  "3m:",
  output.premium.single["3m"] || "MISSING",
  "TON"
);

console.log(
  "6m:",
  output.premium.single["6m"] || "MISSING",
  "TON"
);

console.log(
  "12m:",
  output.premium.single["12m"] || "MISSING",
  "TON"
);

console.log("==========================");


// ======================================================
// ذخیره
// ======================================================

fs.writeFileSync(
  pricesFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log("Prices converted successfully");
