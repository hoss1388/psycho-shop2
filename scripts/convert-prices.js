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


// ---------------- STARS ----------------

const stars50 = fragmentData.find(
  x => x.product_type === "stars" &&
  x.item_name.includes("50") &&
  x.currency === "TON"
);

if (stars50) {
  output.stars.tonPerStar =
    stars50.price / 50;
}


// ---------------- PREMIUM ----------------

fragmentData
.filter(x => x.product_type === "premium" && x.currency === "TON")
.forEach(item => {

  let plan = null;

  if (item.item_name.includes("3")) {
    plan = "3m";
  }

  if (item.item_name.includes("6")) {
    plan = "6m";
  }

  if (item.item_name.includes("12")) {
    plan = "12m";
  }

  if (plan) {

    // قیمت خام Fragment
    output.premium.single[plan] = item.price;

    // چهار بوست همان قیمت Fragment است
    // فقط سود در pricing.js فرق می‌کند
    output.premium.four[plan] = item.price;

  }

});


fs.writeFileSync(
  pricesFile,
  JSON.stringify(output, null, 2),
  "utf8"
);


console.log("Prices converted successfully");
