const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
{
action:{
type:String,
required:true
},

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

evidence:{
type:mongoose.Schema.Types.ObjectId,
ref:"Evidence"
}

},
{timestamps:true}
);

module.exports = mongoose.model("Log",logSchema);