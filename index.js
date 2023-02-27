const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//uri of database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.avm9c.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("UniversalHostel");
    const usersCollection = database.collection("users");
    const roomCollection = database.collection("rooms");
    const mealCollection = database.collection("meals");

    // user post api
    app.post("/users-data", async (req, res) => {
      const cursor = await usersCollection.insertOne(req.body);
      res.json(cursor);
    });

    // users when the first time register put api
    app.put("/users-data", async (req, res) => {
      const query = { email: req.body.email };
      const options = { upsert: true };
      const updateDocs = { $set: req.body };

      // getting user info if already have in the db
      const userInfo = await usersCollection.findOne(query);
      if (userInfo) {
        res.send("already in the db ");
      } else {
        const result = await usersCollection.updateOne(
          query,
          updateDocs,
          options
        );
      }
    });

    // put user for google login
    app.put("/users-data", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // user profile update api here
    app.put("/profile-update", async (req, res) => {
      const query = { email: req.body.email };
      const options = { upsert: true };
      const updateDocs = { $set: req.body };
      const result = await usersCollection.updateOne(
        query,
        updateDocs,
        options
      );
      res.json(result);
    });

    // users follow and following api start here
    app.put("/user", async (req, res) => {
      const bloggerId = req.body.bloggerId;
      const userId = req.body.userId;
      const options = { upsert: true };

      // getting blogger info here
      const blogger = await usersCollection.findOne({
        _id: ObjectId(bloggerId),
      });
      const bloggerPayload = {
        id: blogger?._id,
        email: blogger?.email,
        name: blogger?.displayName,
        image: blogger?.image,
      };
      // getting user info here
      const user = await usersCollection.findOne({ _id: ObjectId(userId) });
      const userPayload = {
        id: user?._id,
        email: user?.email,
        name: user?.displayName,
        image: user?.image,
      };

      // update blogger here
      const bloggerDocs = {
        $push: { followers: userPayload },
      };
      // update user here
      const userDocs = {
        $push: { following: bloggerPayload },
      };

      const updateBlogger = await usersCollection.updateOne(
        blogger,
        bloggerDocs,
        options
      );
      const updateUser = await usersCollection.updateOne(
        user,
        userDocs,
        options
      );
      res.send("followers following updated");
    });

    // and user follow and following api end here
    app.get("/users", async (req, res) => {
      const user = usersCollection.find({});
      const result = await user.toArray();
      res.send(result);
    });

    // and user follow and following api end here
    app.get("/users-data", async (req, res) => {
      const user = usersCollection.find({});
      const result = await user.toArray();
      res.send(result);
    });

    // users information by email
    app.get("/users-data/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection?.findOne(query);
      res.json(user);
    });

    //make admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // blog delete api
    app.delete("/delete-user/:id", async (req, res) => {
      const query = { _id: ObjectId(req.params.id) };
      const result = await usersCollection.deleteOne(query);
      res.json(result);
    });

    // for getting all room
    app.get("/rooms", async (req, res) => {
      const cursor = roomCollection?.find({});
      const rooms = await cursor?.toArray();
      res.json(rooms);
    });

    // for posting rooms
    app.post("/rooms", async (req, res) => {
      const room = req.body;
      const result = await roomCollection.insertOne(room);
      res.json(result);
    });

    // for single room
    app.get("/rooms/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const cursor = await roomCollection.findOne(query);
      res.json(cursor);
    });

    // room delete api
    app.delete("/delete-room/:id", async (req, res) => {
      const query = { _id: ObjectId(req?.params?.id) };
      const result = await roomCollection?.deleteOne(query);
      res.json(result);
    });
    // for getting all meal
    app.get("/meals", async (req, res) => {
      const cursor = mealCollection?.find({});
      const meals = await cursor?.toArray();
      res.json(meals);
    });

    // for posting meals
    app.post("/meals", async (req, res) => {
      const meal = req.body;
      const result = await mealCollection.insertOne(meal);
      res.json(result);
    });

    // for single meal
    app.get("/meals/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const cursor = await mealCollection.findOne(query);
      res.json(cursor);
    });

    // meal delete api
    app.delete("/delete-meal/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const result = await mealCollection?.deleteOne(query);
      res.json(result);
    });

    //-------------------------------------------------------------
    //-------------------------------------------------------------
    //------------------CHRISTOS-----------------------------------
    //-------------------------------------------------------------
    //-------------------------------------------------------------

    // for getting all meal
    // app.put("/meals", async (req, res) => {
    //   const breakfast = req.body.breakfast;
    //   const lunch = req.body.lunch;
    //   const dinner = req.body.dinner;

    //   if (breakfast.id) {

    //     const cursor = await mealCollection.findOne({
    //       _id: new ObjectId(breakfast.id),
    //     });
    //     const booking = cursor.bookedBy;

    //     const allBreakfasts = await mealCollection.find({}).toArray();

    //     allBreakfasts.map(item=>{
    //       if(item.time="Breakfast"){

    //       }
    //     })

    //     console.log(allBreakfasts);

    //     booking.push(req.body.currentUser);

    //     const filter = { _id: new ObjectId(breakfast.id) };
    //     const updateDoc = { $set: { bookedBy: booking } };
    //     const result = await mealCollection.updateOne(filter, updateDoc);
    //     res.send(result);
    //   }
    // });

    //Remove user from Admin position - Christos
    app.put("/users", async (req, res) => {
      const filter = { email: req.body.email };
      const updateDoc = { $set: { role: "user" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Get user info by ID - Christos
    app.get("/users/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    // Delete user by ID - Christos
    app.delete("/users/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await usersCollection.deleteOne(query);
      res.json(result);
      console.log("Deleted item successfully");
      console.log(result);
    });
  } finally {
    // await client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`<h1>Universal Hostel Server Running</h1>`);
});

app.listen(port, () => {
  console.log(`Listening port: ${port}`);
});
