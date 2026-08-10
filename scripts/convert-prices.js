const fs = require("fs");

const pricesFile = "./api/prices.json";

const tonPrice = Number(process.env.TON_PRICE || 0);

if (!tonPrice) {
    console.error("TON price is missing");
    process.exit(1);
}


// =====================================
// FRAGMENT STARS DATA
// =====================================

const fragmentData = JSON.parse(
    fs.readFileSync(pricesFile, "utf8")
);


// =====================================
// FINAL OUTPUT
// =====================================

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


// =====================================
// STARS
// =====================================
// این قسمت را دست نمی‌زنیم
// =====================================

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


// =====================================
// PREMIUM - LIVE PRICES
// =====================================

function getPremiumPrice(file) {

    const data = JSON.parse(
        fs.readFileSync(file, "utf8")
    );

    if (!data || typeof data.price !== "number") {

        console.error(
            "Invalid Premium response:",
            data
        );

        process.exit(1);
    }

    return data.price;
}


const premium3 =
    getPremiumPrice("./api/premium-3.json");

const premium6 =
    getPremiumPrice("./api/premium-6.json");

const premium12 =
    getPremiumPrice("./api/premium-12.json");


// =====================================
// SINGLE PREMIUM
// =====================================

output.premium.single["3m"] = premium3;

output.premium.single["6m"] = premium6;

output.premium.single["12m"] = premium12;


// =====================================
// FOUR BOOST
// =====================================
// قیمت خام Fragment همان قیمت Premium است
// سود نهایی در pricing.js محاسبه می‌شود
// =====================================

output.premium.four["3m"] = premium3;

output.premium.four["6m"] = premium6;

output.premium.four["12m"] = premium12;


// =====================================
// SAVE
// =====================================

fs.writeFileSync(
    pricesFile,
    JSON.stringify(output, null, 2),
    "utf8"
);


console.log("Prices converted successfully");

console.log("TON:", tonPrice);

console.log("Stars TON/Star:",
    output.stars.tonPerStar
);

console.log("Premium 3M:",
    premium3,
    "TON"
);

console.log("Premium 6M:",
    premium6,
    "TON"
);

console.log("Premium 12M:",
    premium12,
    "TON"
);
