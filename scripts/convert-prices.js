const fs = require("fs");

const pricesFile = "./api/prices.json";

const tonPrice = Number(process.env.TON_PRICE || 0);

if (!tonPrice) {
  console.error("TON price is missing");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(pricesFile, "utf8"));

const converted = data.map(item => {

  let profit = 40000;

  // استارز همیشه 40 هزار تومان سود
  if (item.product_type === "stars") {
    profit = 40000;
  }

  // پریمیوم
  if (item.product_type === "premium") {

    // اگر محصول چهار بوست باشد
    if (
      item.item_name.toLowerCase().includes("4") ||
      item.item_name.toLowerCase().includes("four")
    ) {
      profit = 150000;
    } 
    // تک بوست
    else {
      profit = 40000;
    }
  }

  const tomanPrice = Math.round(
    (item.total * tonPrice) + profit
  );

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
