const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");
const axios = require("axios");
const redis = require("redis");
require("dotenv").config();

const redisPort = 6379;
const client = redis.createClient(redisPort);

client.on("error", (err) => {
  console.log(err);
});

const app = express();
const port = process.env.PORT || 6969;

const db = require("./queries");

app.use(cors());

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (request, response) => {
  response.json({ info: "Node.js, Express, and Postgres API" });
});

app.get("/getAllUsers", db.getUsers);
app.get("/getUser/:id", db.getUserById);
app.post("/users/", db.createUser);
app.put("/users/:id", db.updateUser);
app.delete("/users/:id", db.deleteUser);

// Newly Added from Task B
app.get("/breweries", async (req, res) => {
  const page = req.query.page;
    try {
        client.get(page, async (err, breweries) => {
            if (err) throw err;
    
            if (breweries) {
                res.status(200).send({
                    breweries: JSON.parse(breweries),
                    message: "data retrieved from the cache"
                });
            } else {
                const breweries = await axios.get(`https://api.openbrewerydb.org/breweries?per_page=${page}`);
                client.setex(page, 600, JSON.stringify(breweries.data));
                res.status(200).send({
                    breweries: breweries.data,
                    message: "cache miss"
                });
            }
        });
    } catch(err) {
        res.status(500).send({message: err.message});
    }
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});

module.exports = app;
