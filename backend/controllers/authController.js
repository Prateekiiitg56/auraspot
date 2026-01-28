const User = require("../models/User");

exports.register = async(req,res)=>{
 const user = await User.create(req.body);
 res.json(user);
};

exports.login = async(req,res)=>{
 const user = await User.findOne({email:req.body.email});
 res.json(user);
};
