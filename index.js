const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const nodeCron = require("node-cron");
const port = process.env.PORT || 5000;

// middleware
app.use(cors({ origin: "*" }));
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
      const query = { _id: ObjectId(req?.params?.id) };
      const result = await mealCollection?.deleteOne(query);
      res.json(result);
    });

    //-------------------------------------------------------------
    //-------------------------------------------------------------
    //------------------CHRISTOS-----------------------------------
    //-------------------------------------------------------------
    //-------------------------------------------------------------

    //Room cancelation

    app.put("/cancelRoom", async (req, res) => {
      const userId = req.body.currentUser;
      const roomId = req.body.roomId;
      const currentRoom = await roomCollection.findOne({
        _id: new ObjectId(roomId),
      });
      const currentUser = await usersCollection.findOne({
        _id: new ObjectId(userId),
      });

      if (currentRoom.category === "Business") {
        const roomFilter = { _id: new ObjectId(roomId) };
        const roomDoc = {
          $set: {
            bookedBy: [],
            bookedOn: "",
            bookedTill: "",
          },
        };
        const updateRoom = await roomCollection.updateOne(roomFilter, roomDoc);

        const userFilter = { _id: new ObjectId(userId) };
        const userDoc = {
          $set: { room: "", bookedOn: "", bookedTill: "" },
        };
        const updateUser = await usersCollection.updateOne(userFilter, userDoc);

        console.log(updateRoom, updateUser);
      } else {
        const seats = currentRoom.seat;
        const roomFilter = { _id: new ObjectId(roomId) };
        const roomResidents = currentRoom.bookedBy.filter((e) => {
          return e.uid != userId;
        });
        console.log(roomResidents);
        const roomDoc = { $set: { bookedBy: roomResidents, seat: seats + 1 } };
        const updateRoom = await roomCollection.updateOne(roomFilter, roomDoc);

        const userFilter = { _id: new ObjectId(userId) };
        const userDoc = {
          $set: { room: "", bookedOn: "", bookedTill: "" },
        };
        const updateUser = await usersCollection.updateOne(userFilter, userDoc);

        console.log(roomResidents);
      }
    });

    //Room Selection
    app.put("/rooms", async (req, res) => {
      const currentUser = req.body.currentUser;
      const roomId = req.body.roomId;
      const rooms = await roomCollection.find({}).toArray();
      const currentRoom = await roomCollection.findOne({
        _id: new ObjectId(roomId),
      });

      const today = new Date();
      const oneMonth = new Date(
        `${today.getFullYear()}-${today.getMonth() + 2}-${today.getDate()}`
      );

      if (currentRoom.category === "Business") {
        if (currentRoom.bookedBy != currentUser) {
          const roomFilter = { _id: new ObjectId(roomId) };
          const roomDoc = {
            $set: {
              bookedBy: currentUser,
              bookedOn: today,
              bookedTill: oneMonth,
            },
          };
          const updateRoom = await roomCollection.updateOne(
            roomFilter,
            roomDoc
          );

          const userFilter = { _id: new ObjectId(currentUser) };
          const userDoc = {
            $set: { room: currentRoom, bookedOn: today, bookedTill: oneMonth },
          };
          const updateUser = await usersCollection.updateOne(
            userFilter,
            userDoc
          );

          console.log(updateRoom, updateUser);
        }
      } else {
        let flag = true;
        currentRoom.bookedBy.map((e) => {
          if (e.uid === currentUser) {
            flag = false;
          }
        });

        if (flag) {
          const seats = currentRoom.seat;
          const roomFilter = { _id: new ObjectId(roomId) };
          const roomResidents = [
            ...currentRoom.bookedBy,
            { uid: currentUser, bookedOn: today, bookedTill: oneMonth },
          ];
          const roomDoc = {
            $set: { bookedBy: roomResidents, seat: seats - 1 },
          };
          const updateRoom = await roomCollection.updateOne(
            roomFilter,
            roomDoc
          );

          const userFilter = { _id: new ObjectId(currentUser) };
          const userDoc = {
            $set: { room: currentRoom, bookedOn: today, bookedTill: oneMonth },
          };
          const updateUser = await usersCollection.updateOne(
            userFilter,
            userDoc
          );

          console.log(updateRoom, updateUser);
        }
      }
    });

    // Meal selection

    const job = nodeCron.schedule("* * 23 * * *", async () => {
      const today = new Date();
      const tomorrow = new Date(
        `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
      );
      const todayDate = today.toDateString();
      const tomorrowDate = tomorrow.toDateString();
      const meals = await mealCollection.find({}).toArray();
      meals.map((meal) => {
        meal.bookedBy.map(async (element) => {
          const tempDate = element.mealDay.toDateString();
          if (tempDate < todayDate) {
            const query = {
              _id: new ObjectId(meal._id),
              "bookedBy.uid": element.uid,
            };
            const updateDoc = { $set: { "bookedBy.$.mealDay": tomorrow } };
            const result = await mealCollection.updateOne(query, updateDoc);
            // console.log(result);
          }
          // console.log(tempDate);
        });
      });
    });

    app.put("/meals", async (req, res) => {
      // console.log(req.body);
      const breakfast = req.body.breakfast;
      const lunch = req.body.lunch;
      const dinner = req.body.dinner;

      const today = new Date();

      const tomorrow = new Date(
        `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate() + 1}`
      );

      if (breakfast.id) {
        const allBreakfasts = await mealCollection
          .find({ time: "Breakfast" })
          .toArray();

        allBreakfasts.map(async (item) => {
          const user = req.body.currentUser;
          const newBooking = item.bookedBy.filter(
            (element) => element.uid != user
          );

          const filter = { _id: item._id };
          const updateDoc = { $set: { bookedBy: newBooking } };
          const result = await mealCollection.updateOne(filter, updateDoc);
        });
        const chosenBreakfast = await mealCollection.findOne({
          _id: new ObjectId(breakfast.id),
        });
        const booking = chosenBreakfast.bookedBy;
        // booking.push(req.body.currentUser);
        booking.push({ uid: req.body.currentUser, mealDay: tomorrow });

        const filter = { _id: new ObjectId(breakfast.id) };
        const updateDoc = { $set: { bookedBy: booking } };
        const result = await mealCollection.updateOne(filter, updateDoc);
      } else {
        const allBreakfasts = await mealCollection
          .find({ time: "Breakfast" })
          .toArray();

        allBreakfasts.map(async (item) => {
          const newBooking = item.bookedBy.filter(
            (element) => element.uid != req.body.currentUser
          );

          const filter = { _id: item._id };
          const updateDoc = { $set: { bookedBy: newBooking } };
          const result = await mealCollection.updateOne(filter, updateDoc);
        });
      }

      if (lunch.id) {
        const allLunch = await mealCollection.find({ time: "Lunch" }).toArray();

        allLunch.map(async (item) => {
          const user = req.body.currentUser;
          const newBooking = item.bookedBy.filter(
            (element) => element.uid != user
          );

          const filter = { _id: item._id };
          const updateDoc = { $set: { bookedBy: newBooking } };
          const result = await mealCollection.updateOne(filter, updateDoc);
        });
        const chosenLunch = await mealCollection.findOne({
          _id: new ObjectId(lunch.id),
        });
        const booking = chosenLunch.bookedBy;
        booking.push({ uid: req.body.currentUser, mealDay: tomorrow });

        const filter = { _id: new ObjectId(lunch.id) };
        const updateDoc = { $set: { bookedBy: booking } };
        const result = await mealCollection.updateOne(filter, updateDoc);
      } else {
        const allLunch = await mealCollection.find({ time: "Lunch" }).toArray();

        allLunch.map(async (item) => {
          const newBooking = item.bookedBy.filter(
            (element) => element.uid != req.body.currentUser
          );

          const filter = { _id: item._id };
          const updateDoc = { $set: { bookedBy: newBooking } };
          const result = await mealCollection.updateOne(filter, updateDoc);
        });
      }

      if (dinner.id) {
        const allDinner = await mealCollection
          .find({ time: "Dinner" })
          .toArray();

        allDinner.map(async (item) => {
          const user = req.body.currentUser;
          const newBooking = item.bookedBy.filter(
            (element) => element.uid != user
          );

          const filter = { _id: item._id };
          const updateDoc = { $set: { bookedBy: newBooking } };
          const result = await mealCollection.updateOne(filter, updateDoc);
        });
        const chosenDinner = await mealCollection.findOne({
          _id: new ObjectId(dinner.id),
        });
        const booking = chosenDinner.bookedBy;
        booking.push({ uid: req.body.currentUser, mealDay: tomorrow });

        const filter = { _id: new ObjectId(dinner.id) };
        const updateDoc = { $set: { bookedBy: booking } };
        const result = await mealCollection.updateOne(filter, updateDoc);
      } else {
        const allDinner = await mealCollection
          .find({ time: "Dinner" })
          .toArray();

        allDinner.map(async (item) => {
          const newBooking = item.bookedBy.filter(
            (element) => element.uid != req.body.currentUser
          );

          const filter = { _id: item._id };
          const updateDoc = { $set: { bookedBy: newBooking } };
          const result = await mealCollection.updateOne(filter, updateDoc);
        });
      }

      const doc = await mealCollection.find({}).toArray();
      console.log(doc);
      res.send(doc);
    });

    //Remove user from Admin position - Christos
    app.put("/users", async (req, res) => {
      const filter = { email: req.body.email };
      const updateDoc = { $set: { role: "user" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Get unoccupied rooms - Christos
    app.get("/unoccupiedRooms", async (req, res) => {
      const query = { bookedBy: [] };
      const cursor = await roomCollection.find(query).toArray();
      res.send(cursor);
    });

    // Get occupied rooms - Christos
    app.get("/occupiedRooms", async (req, res) => {
      const query = { category: "Economic" };
      const sharedRooms = await roomCollection.find(query).toArray();
      const cursor = sharedRooms.filter(
        (e) => parseInt(e.seat) > 0 && parseInt(e.seat) < 4
      );
      res.send(cursor);
    });

    // Get full rooms - Christos
    app.get("/fullRooms", async (req, res) => {
      const sharedRooms = await roomCollection
        .find({ category: "Economic" })
        .toArray();
      const privateRooms = await roomCollection
        .find({ category: "Business" })
        .toArray();
      const cursor1 = sharedRooms.filter((e) => parseInt(e.seat) === 0);

      const cursor2 = privateRooms.filter(
        (e) => e.bookedBy != "" && e.bookedBy != []
      );
      const cursor = cursor1.concat(cursor2);
      res.send(cursor);
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
