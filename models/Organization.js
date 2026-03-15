const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

type:{
type:String,
enum:["police","forensic_lab","court"],
default:"police"
},

address:String,

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Organization",organizationSchema);