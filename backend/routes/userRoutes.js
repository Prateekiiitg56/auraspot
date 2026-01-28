const router = require("express").Router();
const User = require("../models/User");

router.post("/sync", async (req, res) => {
  const { firebaseUid, name, email } = req.body;

  let user = await User.findOne({ firebaseUid });

  if (!user) {
    user = await User.create({
      firebaseUid,
      name,
      email,
      role: "USER"
    });
  }

  res.json(user);
});
router.get("/email/:email", async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  res.json(user);
});


module.exports = router;
