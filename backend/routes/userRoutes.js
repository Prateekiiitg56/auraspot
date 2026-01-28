const router = require("express").Router();
const User = require("../models/User");

router.post("/sync", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("USER SYNC ERROR:", err);
    res.status(500).json({ message: "Failed to sync user" });
  }
});
router.get("/email/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error("GET USER BY EMAIL ERROR:", err);
    res.status(500).json({ message: "Failed to get user" });
  }
});


module.exports = router;
