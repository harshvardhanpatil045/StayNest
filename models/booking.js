const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    checkIn: {
        type: Date,
        required: true
    },

    checkOut: {
        type: Date,
        required: true
    },

    guests: { 
    type: Number, 
    required: true 
},

packageName: {
    type: String,
    required: true
},

packagePrice: {
    type: Number,
    required: true
},

totalPrice: { 
    type: Number, 
    required: true 
}
});

module.exports = mongoose.model("Booking", bookingSchema);