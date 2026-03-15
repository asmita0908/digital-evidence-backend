const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema({

title:{
type:String,
required:true,
index:true
},

description:{
type:String,
required:true,
index:true
},

fileUrl:{
type:String,
required:true
},

filePath:{
type:String,
required:true
},

fileHash:{
type:String,
required:true
},

isTampered:{
type:Boolean,
default:false
},

uploadedBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

case:{
type:mongoose.Schema.Types.ObjectId,
ref:"Case"
},

custodyHistory:[

{
officer:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},
action:String,
date:{
type:Date,
default:Date.now
}
}

]

},{timestamps:true});

module.exports = mongoose.model("Evidence",evidenceSchema);