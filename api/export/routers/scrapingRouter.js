"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
const Client = new pg_1.Pool({
    user: "postgres",
    host: process.env.NODE_ENV === "docker" ? "postgres" : "localhost",
    database: "postgres",
    password: "pass123",
    port: 5432,
});
Client.on("connect", (client) => {
    client
        .query(`
    CREATE TABLE IF NOT EXISTS "offers" (
      "id" SERIAL,
      "image" VARCHAR(100) NOT NULL unique,
      "name" VARCHAR(100) NOT NULL,
      "locality" VARCHAR(100) NOT NULL,
      "price" INT NOT NULL,
      PRIMARY KEY ("id")
     );`)
        .catch((err) => console.log("DB error", err));
});
const updateOffers = async () => {
    var e_1, _a;
    // Get offers
    const result = (await axios_1.default.get("https://www.sreality.cz/api/en/v2/estates?category_main_cb=1&category_type_cb=1&locality_country_id=10001&no_auction=1&per_page=500&tms=" +
        Date.now())).data;
    const rawAdsList = result._embedded.estates;
    try {
        for (var rawAdsList_1 = __asyncValues(rawAdsList), rawAdsList_1_1; rawAdsList_1_1 = await rawAdsList_1.next(), !rawAdsList_1_1.done;) {
            const rawAd = rawAdsList_1_1.value;
            const betterAd = {
                name: rawAd.name,
                locality: rawAd.locality,
                price: rawAd.price,
                image: rawAd._links.images[0].href,
            };
            // save to DB
            await Client.query("INSERT INTO offers(image, name, locality, price) VALUES ($1, $2, $3, $4) ON CONFLICT (image) DO NOTHING;", [betterAd.image, betterAd.name, betterAd.locality, betterAd.price]);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rawAdsList_1_1 && !rawAdsList_1_1.done && (_a = rawAdsList_1.return)) await _a.call(rawAdsList_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
};
// Get offers
router.get("/", async (req, res) => {
    try {
        Client.query(`Select * from offers`, async (err, result) => {
            if (!err) {
                // when DB empty
                if (result.rows.length === 0) {
                    await updateOffers();
                    Client.query(`Select * from offers`, (err, result) => {
                        if (!err) {
                            res.send(result.rows);
                            return;
                        }
                        else {
                            console.log(err);
                            res.send({ status: "error" });
                        }
                    });
                }
                else {
                    res.send(result.rows);
                    return;
                }
            }
            else {
                console.log(err);
                res.send({ status: "error" });
            }
        });
    }
    catch (error) {
        console.log(error);
        res.send({ status: "error" });
    }
});
// Update offers
router.patch("/", async (req, res) => {
    try {
        // Get offers
        await Client.query("truncate table offers");
        await updateOffers();
        res.send({ status: "ok" });
    }
    catch (error) {
        console.log(error);
        res.send({ status: "error" });
    }
});
exports.default = router;
