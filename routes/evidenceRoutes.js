const express = require("express");
const router = express.Router();
const multer = require("multer");

const evidenceController = require("../controllers/evidenceController");

const {protect} = require("../middleware/authMiddleware");
const {allowRoles} = require("../middleware/roleMiddleware");

const storage = multer.diskStorage({

destination:function(req,file,cb){
cb(null,"uploads/");
},

filename:function(req,file,cb){
cb(null,Date.now()+"-"+file.originalname);
}

});

const upload = multer({storage});


// Upload Evidence
router.post(
"/upload",
protect,
allowRoles("admin","officer"),
upload.single("file"),
evidenceController.uploadEvidence
);


// Get all evidence
router.get(
"/all",
protect,
allowRoles("admin","officer","forensic","viewer"),
evidenceController.getAllEvidence
);


// Search Evidence
router.get(
"/search",
protect,
allowRoles("admin","officer","forensic","viewer"),
evidenceController.searchEvidence
);


// Verify Evidence
router.get(
"/verify/:id",
protect,
allowRoles("admin","forensic"),
evidenceController.verifyEvidence
);


// Download Evidence
router.get(
"/download/:id",
protect,
allowRoles("admin","officer","forensic","viewer"),
evidenceController.downloadEvidence
);


// Generate Certificate
router.get(
"/certificate/:id",
protect,
allowRoles("admin","officer","forensic"),
evidenceController.generateCertificate
);

module.exports = router;