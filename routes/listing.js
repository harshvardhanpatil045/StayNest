const express = require ("express");
const router= express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

//Index Route & //Create Route
router.route("/")
.get(wrapAsync(listingController.index))
.post(
    isLoggedIn,
    upload.fields([
        { name: "listing[image]", maxCount: 1 },
        { name: "listing[packages][0][image]", maxCount: 1 },
        { name: "listing[packages][1][image]", maxCount: 1 },
        { name: "listing[packages][2][image]", maxCount: 1 }
    ]),
    validateListing,
    wrapAsync(listingController.createListing)
);


//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);


//show route &//Update Route&//Delete Route
router.route("/:id")
.get( wrapAsync(listingController.showListing))
.put(isLoggedIn,isOwner,upload.single("listing[image]"), wrapAsync(listingController.updateListing))
.delete(isLoggedIn,isOwner,wrapAsync(listingController.deleteListing));


//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner,wrapAsync(listingController.renderEditForm));


module.exports = router;