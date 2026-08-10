/* =========================================================
   Psycho Shop - Fragment Live Pricing Engine
   -----------------------------------------------------------
   این فایل مسئول موارد زیر است:
   - خواندن قیمت آنی استارز/پریمیوم از /api/prices.json
     (این فایل باید توسط سرور شما به‌صورت دوره‌ای از فرگمنت
     آپدیت شود - به server/update-prices.js نگاه کنید)
   - محاسبه قیمت نهایی به تومان با احتساب سود دلخواه شما
   - آپدیت خودکار قیمت‌های نمایش داده شده روی صفحه
   - ست کردن data-price روی هر کارت تا دکمه «افزودن به سبد
     خرید» (در script.js) عدد درست را به سبد خرید بفرستد
   ========================================================= */
(function () {
    "use strict";
console.log("pricing.js loaded");
    var PRICE_ENDPOINT = "api/prices.json";
    var REFRESH_MS = 3 * 60 * 1000; // هر ۳ دقیقه یک‌بار قیمت آپدیت می‌شود

    // ---- سودهایی که خودتان مشخص کردید ----
    var MARGIN_STARS = 47000;          // سود ثابت روی بسته‌های استارز (به جز ۱۳ و ۲۱ که ثابت هستند)
    var MARGIN_PREMIUM_SINGLE = 40000; // سود روی هر پلن «تک بوست»
    var MARGIN_PREMIUM_FOUR = 150000;  // سود روی هر پلن «چهار بوست»

    // ---- قیمت‌های ثابتی که خودتان خواستید (به فرگمنت کاری ندارند) ----
    var FIXED_STARS = { 13: 50000, 21: 165000 };

    var priceData = null;
    var listeners = [];

    function roundTo(n, step) {
        step = step || 1000;
        return Math.ceil(n / step) * step;
    }

    function fmt(n) {
        n = Math.round(n || 0);
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /* ---------------- دریافت قیمت از سرور خودمان ---------------- */
    function fetchPrices() {
        return fetch(PRICE_ENDPOINT + "?_=" + Date.now(), { cache: "no-store" })
            .then(function (res) {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
            })
            .then(function (data) {
                priceData = data;
                notify();
                return data;
            })
            .catch(function (err) {
                console.warn("[pricing] دریافت قیمت آنی فرگمنت ناموفق بود، از آخرین مقدار موجود استفاده می‌شود.", err);
                notify(); // با priceData قبلی (اگر باشد) دوباره رندر کن
            });
    }

    function notify() {
        listeners.forEach(function (fn) {
            try { fn(priceData); } catch (e) { console.error(e); }
        });
    }

    /* ---------------- محاسبات ---------------- */

    // قیمت خام N استار به تومان، طبق نرخ لحظه‌ای فرگمنت (بدون سود)
    function starsRawToman(qty) {
        if (!priceData || !priceData.stars) return null;
        var tonPerStar = priceData.stars.tonPerStar;
        var tonToToman = priceData.tonToToman;
        if (!tonPerStar || !tonToToman) return null;
        return tonPerStar * qty * tonToToman;
    }

    // قیمت نهایی N استار به تومان (با سود / یا قیمت ثابتی که خودتان دادید)
    window.psychoStarsPrice = function (qty) {
        qty = parseInt(qty, 10);
        if (!qty || qty <= 0) return null;
        if (FIXED_STARS.hasOwnProperty(qty)) return FIXED_STARS[qty];
        var raw = starsRawToman(qty);
        if (raw === null) return null;
        return roundTo(raw, 500) + MARGIN_STARS;
    };

    // قیمت خام یک پلن پریمیوم به تومان (بدون سود)
    function premiumRawToman(tier, plan) {
        if (!priceData || !priceData.premium || !priceData.premium[tier]) return null;
        var ton = priceData.premium[tier][plan];
        var tonToToman = priceData.tonToToman;
        if (!ton || !tonToToman) return null;
        return ton * tonToToman;
    }

    // tier: "single" یا "four" | plan: "3m" | "6m" | "12m"
    window.psychoPremiumPrice = function (tier, plan) {
        var raw = premiumRawToman(tier, plan);
        if (raw === null) return null;
        var margin = tier === "four" ? MARGIN_PREMIUM_FOUR : MARGIN_PREMIUM_SINGLE;
        return roundTo(raw, 1000) + margin;
    };

    /* ---------------- اتصال به DOM ----------------
       هر المنتی که می‌خواهد قیمت آنی نشان بدهد باید یکی از این‌ها را داشته باشد:

       برای استارز:
         <div class="service-card" data-request="stars" data-stars-qty="50">
             ...
             <div class="service-price" data-price-slot></div>
             <button data-request="stars" ...>افزودن به سبد خرید</button>
         </div>

       برای پریمیوم:
         <div class="service-card" data-request="premium" data-premium-tier="single" data-premium-plan="3m">
             <div class="service-price" data-price-slot></div>
         </div>

       تعداد دلخواه استار:
         <input id="starsCustomQty" type="number" min="1">
         <div id="starsCustomPriceOut"></div>
       ------------------------------------------------- */

    function renderCards() {
        var cards = document.querySelectorAll(".service-card[data-request='stars'][data-stars-qty], .service-card[data-request='premium'][data-premium-tier]");
        cards.forEach(function (card) {
            var price = null;
            if (card.getAttribute("data-request") === "stars") {
                var qty = parseInt(card.getAttribute("data-stars-qty"), 10);
                price = window.psychoStarsPrice(qty);
            } else {
                var tier = card.getAttribute("data-premium-tier");
                var plan = card.getAttribute("data-premium-plan");
                price = window.psychoPremiumPrice(tier, plan);
            }

            var slot = card.querySelector("[data-price-slot]");
            if (price === null) {
                if (slot) slot.textContent = "در حال دریافت قیمت آنی...";
                card.setAttribute("data-price", ""); // دکمه افزودن تا آماده نشدن قیمت غیرفعال می‌ماند
            } else {
                if (slot) slot.textContent = fmt(price) + " تومان";
                card.setAttribute("data-price", price);
                card.setAttribute("data-unit", "1");
            }
        });

        renderCustomStarsBox();
    }

    function renderCustomStarsBox() {
        var input = document.getElementById("starsCustomQty");
        var out = document.getElementById("starsCustomPriceOut");
        var card = document.getElementById("starsCustomCard");
        var label = document.getElementById("starsCustomQtyLabel");
        if (!input || !out || !card) return;

        var qty = parseInt(input.value, 10);
        if (!qty || qty <= 0) {
            out.textContent = "تعداد استار را وارد کنید";
            card.setAttribute("data-price", "");
            return;
        }
        if (label) label.textContent = "(" + fmt(qty) + " استار)";

        var price = window.psychoStarsPrice(qty);
        if (price === null) {
            out.textContent = "در حال دریافت قیمت آنی...";
            card.setAttribute("data-price", "");
        } else {
            out.textContent = fmt(qty) + " استار = " + fmt(price) + " تومان";
            card.setAttribute("data-price", price);
            card.setAttribute("data-unit", "1");
        }
    }

    document.addEventListener("input", function (e) {
        if (e.target && e.target.id === "starsCustomQty") {
            renderCustomStarsBox();
        }
    });

    listeners.push(renderCards);

    function init() {
        fetchPrices();
        setInterval(fetchPrices, REFRESH_MS);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // برای دیباگ در کنسول
    window.__psychoPricing = { fetchPrices: fetchPrices, get data() { return priceData; } };
})();
