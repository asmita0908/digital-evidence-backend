const mongoose = require("mongoose");

const custodySchema = new mongoose.Schema({

evidence:{
type:mongoose.Schema.Types.ObjectId,
ref:"Evidence"
},

action:{
type:String,
required:true
},

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}

},{timestamps:true});

module.exports = mongoose.model("Custody",custodySchema);