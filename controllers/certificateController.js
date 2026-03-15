const PDFDocument = require("pdfkit");

const Evidence = require("../models/Evidence");

exports.generateCertificate = async(req,res)=>{

try{

const evidence = await Evidence.findById(req.params.id)
.populate("uploadedBy","name email");

const doc = new PDFDocument();

res.setHeader("Content-Type","application/pdf");

res.setHeader(
"Content-Disposition",
"attachment; filename=verification.pdf"
);

doc.pipe(res);

doc.fontSize(22).text("Evidence Verification Certificate");

doc.moveDown();

doc.text(`Evidence ID: ${evidence._id}`);

doc.text(`Title: ${evidence.title}`);

doc.text(`Hash: ${evidence.fileHash}`);

doc.text(`Uploaded By: ${evidence.uploadedBy.name}`);

doc.text(`Verification Date: ${new Date()}`);

doc.end();

}catch(err){

res.status(500).json({
message:"Certificate generation failed"
});

}

};