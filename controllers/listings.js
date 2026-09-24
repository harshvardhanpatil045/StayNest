const { response } = require("express"); 
const Listing = require("../models/listing"); 
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding'); 
const mapToken = process.env.MAP_TOKEN; 
const geocodingClient = mbxGeocoding({accessToken: mapToken}); 
 
//Index Route 
// module.exports.index = async (req,res) =>{ 
//     const allListings = await Listing.find({}); 
//     res.render("listings/index",{ allListings }); 
// }; 
 
module.exports.index = async (req, res) => { 
    const { category } = req.query; 
 
    let allListings; 
 
    if (category) { 
        allListings = await Listing.find({ category: category }); 
    } else { 
        allListings = await Listing.find({}); 
    } 
 
    res.render("listings/index", { 
        allListings, 
        selectedCategory: category 
    }); 
}; 


//new Route 
module.exports.renderNewForm = (req,res) =>{ 
    res.render("listings/new.ejs"); 
}; 


//show route 
module.exports.showListing = (async (req,res) =>{ 
    let {id}= req.params; 

    const listing = await Listing.findById(id)
        .populate({
            path:"reviews",
            populate:{
                path:"author"
            },
        })
        .populate("owner"); 

    if(!listing){ 
        req.flash("error", "Listing you requested for does not exist!"); 
        return res.redirect("/listings"); 
    } 

    res.render("listings/show.ejs", { listing }); 
}); 


//Create Route 
// module.exports.createListing = async(req,res,next) =>{ 
     
//     let response = await geocodingClient.forwardGeocode({ 
//         query: req.body.listing.location, 
//         limit: 1, 
//     }) 
//     .send(); 
     
//     // Main listing image
//     let url = req.files["listing[image]"][0].path; 
//     let filename = req.files["listing[image]"][0].filename; 

//     const newListing = new Listing(req.body.listing); 

//     newListing.owner = req.user._id; 

//     newListing.image = {url, filename}; 


//     // Package images
//     if(newListing.packages){

//         newListing.packages.forEach((pkg, index) => {

//             let packageFile = 
//                 req.files[`listing[packages][${index}][image]`];

//             if(packageFile){

//                 pkg.image = {
//                     url: packageFile[0].path,
//                     filename: packageFile[0].filename
//                 };

//             }

//         });

//     }


//     newListing.geometry = response.body.features[0].geometry; 

//     let savedListing = await newListing.save(); 

//     console.log(savedListing); 

//     req.flash("success", "New Listing Created!"); 

//     res.redirect("/listings"); 
// }; 
// Create Route
module.exports.createListing = async (req, res, next) => {

    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    }).send();


    // Main listing image
    let url = req.files["listing[image]"][0].path;
    let filename = req.files["listing[image]"][0].filename;


    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    newListing.image = {
        url,
        filename
    };


    // ================================
    // HANDLE OPTIONAL PACKAGES
    // ================================

    if (newListing.packages) {

        // Remove completely empty packages
        newListing.packages = newListing.packages.filter((pkg) => {

            return pkg.name && pkg.name.trim() !== "" &&
                   pkg.price !== undefined &&
                   pkg.price !== "";

        });


        // Package images
        newListing.packages.forEach((pkg, index) => {

            let packageFile =
                req.files[`listing[packages][${index}][image]`];

            if (packageFile) {

                pkg.image = {
                    url: packageFile[0].path,
                    filename: packageFile[0].filename
                };

            }

        });

    }


    // ================================
    // GEOMETRY
    // ================================

    newListing.geometry = response.body.features[0].geometry;


    // Save listing
    let savedListing = await newListing.save();

    console.log(savedListing);

    req.flash("success", "New Listing Created!");

    res.redirect("/listings");
};


//Edit Route 
module.exports.renderEditForm = async(req, res) =>{ 

    let { id }= req.params; 

    const listing = await Listing.findById(id); 

    if(!listing){ 
        req.flash("error", "Listing you requested for does not exist!"); 
        res.redirect("/listings"); 
    } 
 
    let originalImageUrl =listing.image.url; 

    originalImageUrl = originalImageUrl.replace(
        "/upload",
        "/upload/,h_500w_250"
    ); 

    res.render("listings/edit.ejs",{listing, originalImageUrl}); 
}; 


//update Route 
module.exports.updateListing = async(req,res) =>{ 

    let { id }= req.params; 

    let listing = await Listing.findByIdAndUpdate(
        id,
        {...req.body.listing}
    );  
     
    if(typeof req.file !=="undefined"){ 

        let url = req.file.path; 
        let filename = req.file.filename; 

        listing.image = {url, filename}; 

        await listing.save(); 
    } 
 
    req.flash("success", "Listing Updated!"); 

    res.redirect(`/listings/${id}`); 
}; 


//Delete Route 
module.exports.deleteListing = async (req, res)=>{ 

    let { id }= req.params; 

    let deletedListing = await Listing.findByIdAndDelete(id); 

    console.log(deletedListing); 

    req.flash("success", "Listings Deleted!"); 

    res.redirect("/listings"); 
};