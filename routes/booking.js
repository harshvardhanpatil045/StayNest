const express = require("express");
const router = express.Router();

const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { isLoggedIn } = require("../middleware.js");


// ==================== SHOW BOOKING FORM ====================

router.get("/listings/:id/book", isLoggedIn, async (req, res) => {

    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        return res.send("Listing not found");
    }

    res.render("bookings/new.ejs", { listing });
});


// ==================== RECEIVE BOOKING ====================

router.post("/listings/:id/book", isLoggedIn, async (req, res) => {

    const { id } = req.params;

    const { checkIn, checkOut, guests, packageIndex} = req.body;


    // Find listing
    const listing = await Listing.findById(id);

    if (!listing) {
        return res.send("Listing not found");
    }
    const selectedPackage = listing.packages[Number(packageIndex)];

if (!selectedPackage) {
    return res.send("Please select a valid package");
}


    // Convert dates
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);


    // Check valid dates
    if (endDate <= startDate) {

        return res.send(
            "Check-out date must be after check-in date"
        );

    }


    // Check existing booking
    const existingBooking = await Booking.findOne({

        listing: id,

        checkIn: { $lt: endDate },

        checkOut: { $gt: startDate }

    });


    if (existingBooking) {

    return res.render("bookings/unavailable.ejs", {
        listing
    });

}


    // Calculate number of nights
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const nights = Math.ceil(
        (endDate - startDate) / millisecondsPerDay
    );


    // Calculate total price
    const totalPrice = selectedPackage.price * nights;


  const booking = new Booking({
    listing: listing._id,
    user: req.user._id,
    checkIn: startDate,
    checkOut: endDate,
    guests: Number(guests),
    
     packageName: selectedPackage.name,
    packagePrice: selectedPackage.price,

    totalPrice: totalPrice
});

await booking.save();

res.render("bookings/show.ejs", {
    booking,
    listing
});

});


module.exports = router;