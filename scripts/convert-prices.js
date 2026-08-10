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

  // =========================
  // STARS — دست نخورده
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


// =========================
// STARS
// =========================

const stars50 = fragmentData.find(
  x =>
    x.product_type === "stars" &&
    x.item_name.includes("50") &&
    x.currency === "TON"
);

if (stars50) {
  output.stars.tonPerStar =
    Number(stars50.price) / 50;
}


// =========================
// PREMIUM
// =========================

const premiumItems = fragmentData.filter(
  x =>
    x.product_type === "premium" &&
    x.currency === "TON"
);

premiumItems.forEach(item => {

  const name = String(item.item_name || "").toLowerCase();

  let plan = null;

  // سه ماهه
  if (
    name.includes("3 month") ||
    name.includes("3month") ||
    name.includes("3 months") ||
    name.includes("3m")
  ) {
    plan = "3m";
  }

  // شش ماهه
  else if (
    name.includes("6 month") ||
    name.includes("6month") ||
    name.includes("6 months") ||
    name.includes("6m")
  ) {
    plan = "6m";
  }

  // دوازده ماهه
  else if (
    name.includes("12 month") ||
    name.includes("12month") ||
    name.includes("12 months") ||
    name.includes("12m") ||
    name.includes("1 year") ||
    name.includes("1year")
  ) {
    plan = "12m";
  }

  if (!plan) return;

  const price = Number(item.price);

  if (!price || price <= 0) return;

  // قیمت خام Fragment
  output.premium.single[plan] = price;
  output.premium.four[plan] = price;
});


// =========================
// SAVE
// =========================

fs.writeFileSync(
  pricesFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log("Prices converted successfully");
console.log(JSON.stringify(output, null, 2));
