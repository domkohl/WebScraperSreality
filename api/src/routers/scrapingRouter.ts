import { Router } from "express";
import { Pool } from "pg";
import axios from "axios";
const router = Router();

const Client = new Pool({
  user: "postgres",
  host: process.env.NODE_ENV === "docker" ? "postgres" : "localhost",
  database: "postgres",
  password: "pass123",
  port: 5432,
});

Client.on("connect", (client) => {
  client
    .query(
      `
    CREATE TABLE IF NOT EXISTS "offers" (
      "id" SERIAL,
      "image" VARCHAR(100) NOT NULL unique,
      "name" VARCHAR(100) NOT NULL,
      "locality" VARCHAR(100) NOT NULL,
      "price" INT NOT NULL,
      PRIMARY KEY ("id")
     );`
    )
    .catch((err) => console.log("DB error", err));
});

const updateOffers = async () => {
  // Get offers
  const result = (
    await axios.get(
      "https://www.sreality.cz/api/en/v2/estates?category_main_cb=1&category_type_cb=1&locality_country_id=10001&no_auction=1&per_page=500&tms=" +
        Date.now()
    )
  ).data;
  const rawAdsList: any[] = result._embedded.estates;
  for await (const rawAd of rawAdsList) {
    const betterAd = {
      name: rawAd.name,
      locality: rawAd.locality,
      price: rawAd.price,
      image: rawAd._links.images[0].href,
    };
    // save to DB
    await Client.query(
      "INSERT INTO offers(image, name, locality, price) VALUES ($1, $2, $3, $4) ON CONFLICT (image) DO NOTHING;",
      [betterAd.image, betterAd.name, betterAd.locality, betterAd.price]
    );
  }
};

// Get offers
router.get("/", async (req, res) => {
  try {
    Client.query(`Select * from offers`, async (err, result) => {
      if (!err) {
        // when DB empty
        if (result.rows.length === 0) {
          await updateOffers()
          Client.query(`Select * from offers`, (err, result) => {
            if (!err) {
              res.send(result.rows);
              return
            } else {
              console.log(err);
              res.send({ status: "error" });
            }
          });
        }else{
          res.send(result.rows);
          return
        }
      } else {
        console.log(err);
        res.send({ status: "error" });
      }
    });
  } catch (error) {
    console.log(error);
    res.send({ status: "error" });
  }
});

// Update offers
router.patch("/", async (req, res) => {
  try {
    // Get offers
    await Client.query("truncate table offers");
    await updateOffers()
    res.send({ status: "ok" });
  } catch (error) {
    console.log(error);
    res.send({ status: "error" });
  }
});

export default router;