const fs = require("fs");

const pricesFile = "./api/prices.json";

const tonPrice = Number(process.env.TON_PRICE || 0);

if (!tonPrice) {
  console.error("TON price is missing");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(pricesFile, "utf8"));

const profit = 40000;

const converted = data.map(item => {
  const tomanPrice = Math.round((item.total * tonPrice) + profit);

  return {
    ...item,
    toman_price: tomanPrice,
    toman_price_text: tomanPrice.toLocaleString("fa-IR") + " تومان"
  };
});

fs.writeFileSync(
  pricesFile,
  JSON.stringify(converted, null, 2),
  "utf8"
);

console.log("Prices converted successfully");
