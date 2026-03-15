const Log = require("../models/Log");

exports.getLogs = async (req,res)=>{

try{

const logs = await Log.find()
.populate("user","name email")
.populate("evidence","title")
.sort({createdAt:-1});

res.json(logs);

}catch(error){

console.log(error);

res.status(500).json({
message:"Error fetching logs"
});

}

};