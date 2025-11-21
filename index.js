const express = require("express");
var jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.get("/", (req, res) => {
  res.send("Hello AlphaVibe Gadgets!");
});

// Middleware
app.use(cors());
app.use(express.json());

/* MongoDB starts */
const uri = `mongodb+srv://${process.env.GADGET_DB}:${process.env.GADGET_PASS}@alphavibe-gadgets.fkqtfio.mongodb.net/?retryWrites=true&w=majority&appName=AlphaVibe-Gadgets`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    // Collections
    const userCollection = client.db("usersDB").collection("users");
    const productCollection = client.db("productDB").collection("products");
    const cartCollection = client.db("productDB").collection("cart");

    /* JWT Start */
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign
    })

    /* JWT End */







   /* CART START*/

    app.post("/cart", async (req, res) => {
      res.send(await cartCollection.insertOne(req.body));
    });

    /*  // Get Owner Products
    app.get("/my-products", async (req, res) => {
      const { email } = req.query;
      const result = await productCollection
        .find({ "shopDetails.ownerEmail": email })
        .toArray();
      res.send(result);
    }); */

    /* Get My Cart Products */
    app.get("/my-cart", async (req, res) => {
      const { email } = req.query;
      const result = await cartCollection
        .find({ "customerInfo.email": email })
        .toArray();

      for (const product of result) {
        const matchedProduct = await productCollection.findOne({
          _id: new ObjectId(product.productId),
        });
        if (matchedProduct) {
          product.productInfo = matchedProduct;
        }
      }

      res.send(result);
    });

    /* CART END */

    // Post a product
    app.post("/addProducts", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // Get an specific Product
    app.get("/productDetail/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    // Update a product
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const product = req.body;
      const query = { _id: new ObjectId(id) };
      const updateProduct = {
        $set: product,
      };
      const result = await productCollection.updateOne(query, updateProduct);
      res.send(result);
    });

    // Get All Products of en email
    app.get("/products", async (req, res) => {
      const { featured } = req.query;
      let cursor = productCollection.find();
      if (featured === "homeFeatured") {
        cursor.limit(9);
      }
      const products = await cursor.toArray();
      res.send(products);
    });

    // Get Owner Products
    app.get("/my-products", async (req, res) => {
      const { email } = req.query;
      const result = await productCollection
        .find({ "shopDetails.ownerEmail": email })
        .toArray();

      for (const product of result) {
        const productsExistsInCartCount = await cartCollection.countDocuments({
          productId: product._id.toString(),
        });
        product.productCount = productsExistsInCartCount;
        await productCollection.updateOne(
          { _id: new ObjectId(product._id) },
          { $set: { productCount: productsExistsInCartCount } }
        );
      }

      res.send(result);
    });

    app.get("/my-products/customer/:id", async (req, res) => {
      const id = req.params.id;
      const result = await cartCollection
        .find({
          productId: id,
        })
        .toArray();
      res.send(result);
    });

    app.patch("/products/:id", async (req, res) => {
      res.send(
        await cartCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: req.body }
        )
      );
    });

    // Delete a product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // User API starts
    app.get("/users", async (req, res) => {
      const { searchUser } = req.query;
      const cursor = userCollection.find();
      let result = await cursor.toArray();
      if (searchUser) {
        result = await userCollection
          .find({ name: { $regex: searchUser, $options: "i" } })
          .toArray();
      }
      res.send(result);
    });

    // Get an email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send({ exists: !!user });
    });

    // Get user
    app.get("/updateUser/:id", async (req, res) => {
      const id = req.params.id;
      const user = await userCollection.findOne({ _id: new ObjectId(id) });
      res.send(user);
    });

    // Modify
    app.patch("/users", async (req, res) => {
      const { email, lastSignInTime } = req.body;
      console.log(email, lastSignInTime);
      const filter = { email };
      const updateUser = {
        $set: {
          lastSignIn: lastSignInTime,
        },
      };
      const result = await userCollection.updateOne(filter, updateUser);
      res.send(result);
    });

    // Post an User
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Update an User
    app.patch("/updateUser/:id", async (req, res) => {
      const id = req.params.id;
      const { userName } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateName = {
        $set: {
          name: userName,
        },
      };
      const result = await userCollection.updateOne(filter, updateName);
      res.send(result);
    });

    // Delete a User
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await userCollection?.deleteOne(filter);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

/* MongoDB ends */

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
