const Custody = require("../models/Custody");

exports.getEvidenceTimeline = async(req,res)=>{

try{

const timeline = await Custody.find({

evidence:req.params.id

})
.populate("user","name")
.sort({createdAt:-1});

res.json(timeline);

}catch(error){

res.status(500).json({
message:"Timeline fetch failed"
});

}

};