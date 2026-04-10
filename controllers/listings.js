const Listing = require("../models/listing");
const mapToken = process.env.MAP_TOKEN;


module.exports.index = async(req, res) => {
  const allListings =  await Listing.find({});
  res.render("listings/index.ejs", {allListings});
};


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};


module.exports.showListing = async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path: "reviews",
         populate: { 
        path: "author",
        },
    })
    .populate("owner");
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist");
      return res.redirect("/listings");
    }
    res.render("listings/show", { 
        listing,
        mapToken: process.env.MAP_TOKEN   
    });

};


module.exports.createListing = async (req, res) => {
  try {

    const location = encodeURIComponent(req.body.listing.location);

    const response = await fetch(
      `https://api.maptiler.com/geocoding/${location}.json?key=${process.env.MAP_TOKEN}`
    );

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      req.flash("error", "Invalid location");
      return res.redirect("/listings/new");
    }

    const coordinates = data.features[0].geometry.coordinates;

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    newListing.geometry = {
      type: "Point",
      coordinates: coordinates
    };

    await newListing.save();

    req.flash("success", "New Listing Created");
    res.redirect(`/listings/${newListing._id}`);

  } catch (err) {
    console.log("ERROR:", err);
    res.redirect("/listings");
  }
};


module.exports.renderEditForm = async (req, res) => {
     let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    newOriginalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit", {listing, newOriginalImageUrl});
};


module.exports.updateListing = async(req, res) => {
   let {id} = req.params;
   let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
   if(typeof req.file !== "undefined") {
   let url= req.file.path;
   let filename = req.file.filename;
   listing.image = { url, filename };
   await listing.save();
 }
   req.flash("success", "Listing Updated");
   res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async(req, res) => {
    let {id} = req.params;
   let deletedListing = await Listing.findByIdAndDelete (id);
   console.log(deletedListing);
   res.redirect("/listings");
}