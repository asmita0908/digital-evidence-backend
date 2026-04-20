const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
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
  },

  // 🔐 OTP
  resetOTP:{
    type:Number
  },

  otpExpiry:{
    type:Date
  }
  

},{timestamps:true});
webauthnCredentials: [
  {
    credentialID: String,
    publicKey: String,
    counter: Number
  }
]


// ✅ HASH PASSWORD (ONLY ONE)
userSchema.pre("save", async function(next){
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});


// ✅ MATCH PASSWORD (ONLY ONE)
userSchema.methods.matchPassword = async function(password){
  return await bcrypt.compare(password, this.password);
};


module.exports = mongoose.model("User", userSchema);