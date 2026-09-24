require("dotenv").config();

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({
    accessToken: mapToken
});

const MONGO_URL = process.env.ATLASDB_URL;


// ==================== MAIN ====================

async function main() {

    // Connect to MongoDB Atlas
    await mongoose.connect(MONGO_URL);

    console.log("connected to DB");

    // Initialize listings only AFTER DB connection
    await initDB();

    console.log("data was initialized");

    // Close database connection
    await mongoose.connection.close();

    console.log("Database connection closed");
}


// ==================== INITIALIZE DATABASE ====================

const initDB = async () => {

    // Delete old listings
    await Listing.deleteMany({});

    console.log("Old listings deleted");

    const listings = [];

    // Go through every listing
    for (let obj of initData.data) {

        try {

            console.log("Getting location for:", obj.location);

            // Get coordinates from Mapbox
            let response = await geocodingClient
                .forwardGeocode({
                    query: obj.location,
                    limit: 1
                })
                .send();


            // Check whether Mapbox found the location
            if (
                !response.body.features ||
                response.body.features.length === 0
            ) {

                console.log("Location not found:", obj.location);

                continue;
            }


            // Get geometry from Mapbox
            let geometry = response.body.features[0].geometry;


            // Create listing
            listings.push({

                ...obj,

                // Your actual User ID
                owner: "6ab28d852d5a139b0d4bc8e2",

                // Default category
                category: obj.category || "Trending",

                // Mapbox coordinates
                geometry: geometry

            });


        } catch (err) {

            console.log(
                "Mapbox error for:",
                obj.location
            );

            console.log(err.message);

            // Continue with the next listing
            continue;
        }
    }


    // Insert successfully processed listings
    if (listings.length > 0) {

        await Listing.insertMany(listings);

        console.log(
            `${listings.length} listings inserted successfully`
        );

    } else {

        console.log("No listings were inserted.");

    }
};


// ==================== RUN ====================

main()
    .catch(err => {

        console.log("Initialization failed:");
        console.log(err);

    });