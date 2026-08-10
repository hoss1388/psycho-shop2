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
  // STARS — دست نزن
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

const stars50 = fragmentData.find(
  x =>
    x.product_type === "stars" &&
    x.item_name.includes("50") &&
    x.currency === "TON"
);

if (stars50) {
  output.stars.tonPerStar =
    stars50.price / 50;
}


// ======================================================
// PREMIUM
// ======================================================

const premiumItems = fragmentData.filter(
  x =>
    x.product_type === "premium" &&
    x.currency === "TON"
);

premiumItems.forEach(item => {

  const name = String(item.item_name).toLowerCase();

  let plan = null;

  // 3 months
  if (
    name.includes("3 months") ||
    name.includes("3 month")
  ) {
    plan = "3m";
  }

  // 6 months
  else if (
    name.includes("6 months") ||
    name.includes("6 month")
  ) {
    plan = "6m";
  }

  // 12 months / 1 year
  else if (
    name.includes("12 months") ||
    name.includes("12 month") ||
    name.includes("1 year")
  ) {
    plan = "12m";
  }

  if (!plan) {
    console.log("Premium plan not recognized:", item.item_name);
    return;
  }

  console.log(
    `Fragment Premium: ${item.item_name} = ${item.price} TON`
  );

  // قیمت واقعی Fragment
  output.premium.single[plan] = item.price;

  // Four Boost فعلاً همان قیمت خام Fragment
  // تفاوت سود در pricing.js اعمال می‌شود
  output.premium.four[plan] = item.price;
});


// ======================================================
// CHECK
// ======================================================

console.log(
  "Premium prices:",
  JSON.stringify(output.premium, null, 2)
);


// ======================================================
// SAVE
// ======================================================

fs.writeFileSync(
  pricesFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log("Prices converted successfully");
