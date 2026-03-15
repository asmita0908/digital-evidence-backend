const express = require("express");

const router = express.Router();

const certificateController = require("../controllers/certificateController");

router.get(

"/:id",
certificateController.generateCertificate

);

module.exports = router;