const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
{
  name:{
    type:String,
    required:true
  },

  email:{
    type:String,
    required:true,
    unique:true
  },

  password:{
    type:String,
    required:true,
    minlength:6
  },

  role:{
    type:String,
    enum:["admin","officer","forensic","viewer"],
    default:"officer"
  },

  // 🏢 Organization System
  organization:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Organization"
  },

  is2FAEnabled:{
    type:Boolean,
    default:false
  },

  twoFactorSecret:{
    type:String
  },

  refreshToken:{
    type:String
  },   // ✅ COMMA IMPORTANT

  // 🔐 ADD HERE (INSIDE SCHEMA ONLY)
  resetOTP:{
    type:Number
  },

  otpExpiry:{
    type:Date
  }

},{timestamps:true});

// HASH PASSWORD
userSchema.pre("save",async function(next){

if(!this.isModified("password")) return next();

this.password = await bcrypt.hash(this.password,12);

next();

});


// MATCH PASSWORD
userSchema.methods.matchPassword = async function(password){

return await bcrypt.compare(password,this.password);

};
const bcrypt = require("bcryptjs");

userSchema.pre("save", async function(next){
  if(!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.matchPassword = async function(password){
  return await bcrypt.compare(password, this.password);
};
module.exports = mongoose.model("User",userSchema);