const Property = require("../models/Property");

exports.addProperty = async(req,res)=>{
 const prop = await Property.create({
   ...req.body,
   owner:req.params.ownerId
 });
 res.json(prop);
};

exports.getAll = async(req,res)=>{
 const data = await Property.find().populate("owner","name");
 res.json(data);
};

exports.search = async(req,res)=>{
 const {city,purpose} = req.query;
 const data = await Property.find({city,purpose});
 res.json(data);
};

exports.detail = async(req,res)=>{
 const prop = await Property.findById(req.params.id).populate("owner");
 res.json(prop);
};
