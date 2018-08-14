const { sendResponse } = require("../utils/responseUtils");
const { lightProjectObject } = require("../utils/arrays");
const { getMean } = require("../utils");
const csv = require("csvtojson/v1");
const Albums = require("../models/albums");

module.exports.createAlbum = async (req, res, next) => {
  // grab relevent variables
  let { album, listenDate, spotifyAlbumData, albumName, artistName, albumLengthInMinutes, albumYear, albumTotalTracks, genres, recomendedBy, rating, hasTitleTrack, shortestTrackInSeconds, longestTrackInSeconds, spotifyURI, orderNumber } = req.body;

  // fashion data to fit model
  shortestTrackInSeconds =
    +shortestTrackInSeconds.split(":")[0] * 60 +
    +shortestTrackInSeconds.split(":")[1];
  longestTrackInSeconds =
    +longestTrackInSeconds.split(":")[0] * 60 +
    +longestTrackInSeconds.split(":")[1];
  genres = genres.split(/[\,\/\ ]+/);
  hasTitleTrack = hasTitleTrack === "true" || hasTitleTrack === "TRUE";

  // create album
  Albums.create({ spotifyAlbumData, listenDate, albumName, artistName, albumLengthInMinutes, albumYear, albumTotalTracks, genres, recomendedBy, rating, hasTitleTrack, shortestTrackInSeconds, longestTrackInSeconds, spotifyURI, orderNumber })
    .then(result => {
      console.log('\n=== result ===\n');
      sendResponse(res, 201, result);
      return
    })
    .catch(err => {
      sendResponse(res, 400, err);
      return;
    });
};

module.exports.getAlbums = async (req, res, next) => {
  Albums.aggregate([
    { $project: lightProjectObject },
    { $addFields: { "dayOfWeek": {"$dayOfWeek": "$listenDate"}} },
    { $match:  res.locals.matchifiedQuery || {} },
    { $facet: {
      docs: [
        { $sort: res.locals.options.sort },
        { $skip: (res.locals.options.page - 1) * 25 },
        { $limit: res.locals.options.limit }    
      ],
      pageInfo: [
        { $group: {
          _id: null, 
          totalDocs: { $sum: 1 },
          albumLengthInMinutesTotal: { $sum: "$albumLengthInMinutes" },
          albumTotalTracksTotal: { $sum: "$albumTotalTracks" },
          ratingAverage: { $avg: "$rating" },
          albumTotalTracksAverage: { $avg: "$albumTotalTracks" },
          albumLengthInMinutesAverage: { $avg: "$albumLengthInMinutes" },
          albumYearAverage: { $avg: "$albumYear" },
          albumYearMode: { $push: "$albumYear" },
          ratingMode: { $push: "$rating" },
          albumTotalTracksMode: { $push: "$albumTotalTracks" },
          albumLengthInMinutesMode: { $push: "$albumLengthInMinutes" },
          albumYearsMin: { $min: "$albumYear" },
          ratingsMin: { $min: "$rating" },
          albumTotalTracksMin: { $min: "$albumTotalTracks" },
          albumLengthInMinutesMin: { $min: "$albumLengthInMinutes" },
          albumYearsMax: { $max: "$albumYear" },
          ratingsMax: { $max: "$rating" },
          albumTotalTracksMax: { $max: "$albumTotalTracks" },
          albumLengthInMinutesMax: { $max: "$albumLengthInMinutes" },
        }}
      ]
    }}
  ])
  .then(([albums]) => {
    let { limit, page } = res.locals.options
    if (!albums.pageInfo.length) {
      return sendResponse(res, 200, { docs: [], page: 1, pages: 1, total: 0, limit })
    }
    let { 
      docs, 
      pageInfo: [
        { 
          totalDocs: total, 
          totalDocs, 
          albumLengthInMinutesTotal, 
          albumTotalTracksTotal, 
          ratingAverage, 
          albumTotalTracksAverage, 
          albumLengthInMinutesAverage, 
          albumYearAverage, 
          albumYearMode, 
          ratingMode, 
          albumTotalTracksMode, 
          albumLengthInMinutesMode,
          albumYearsMin,
          ratingsMin,
          albumTotalTracksMin,
          albumLengthInMinutesMin,
          albumYearsMax,
          ratingsMax,
          albumTotalTracksMax,
          albumLengthInMinutesMax,
        }
      ]} = albums
    albumYearMode = getMean(albumYearMode)
    ratingMode = getMean(ratingMode)
    albumTotalTracksMode = getMean(albumTotalTracksMode)
    albumLengthInMinutesMode = getMean(albumLengthInMinutesMode)
    sendResponse(res, 200, {
      docs, 
      total, 
      pages: Math.ceil(+total/+limit), 
      page, 
      limit, 
      stats: {
        albumTotalTracks: {
          min: albumTotalTracksMin, 
          max: albumTotalTracksMax,
          avg: albumTotalTracksAverage,
          mode: albumTotalTracksMode,
          total: albumTotalTracksTotal
        },
        rating: {
          min: ratingsMin, 
          max: ratingsMax,
          avg: ratingAverage,
          mode: ratingMode
        },
        albumLengthInMinutes: {
          min: albumLengthInMinutesMin, 
          max: albumLengthInMinutesMax,
          avg: albumLengthInMinutesAverage,
          mode: albumLengthInMinutesMode,
          total: albumLengthInMinutesTotal    
        },
        albumYear: {
          min: albumYearsMin, 
          max: albumYearsMax,
          avg: albumYearAverage,
          mode: albumYearMode
        },
        totalDocs, 
          min: albumLengthInMinutesMin,
          max: albumLengthInMinutesMax,
          avg: albumLengthInMinutesAverage, 
          mode: albumLengthInMinutesMode,
          total: albumLengthInMinutesTotal  
      }
    })
    return
  })
  .catch(err => {
    sendResponse(res, 400, err)
    return
  })
};

module.exports.uploadCSV = async (req, res, next) => {
  console.log("req.file, req.body =", req.file, req.body);
  if (!req.file) {
    return sendResponse(res, 400, "SEND A FILE");
  }
  let headers,
    results = [],
    albums;
  try {
    albums = await Albums.find().lean();
  } catch (error) {
    sendResponse(res, 400, error);
  }

  let albumURIs = albums.map(album => album.spotifyURI);

  csv()
    .fromString(req.file.buffer)
    .on("header", resHeaders => {
      headers = resHeaders;
      console.log("headers =", headers);
    })
    .on("json", row => {
      row.spotifyURI = row.spotifyURI.split(":")[2];
      row.genres = row.genres.split(/[\,\/\ ]+/);
      row.hasTitleTrack = row.hasTitleTrack === "TRUE";
      row.shortestTrackInSeconds =
        +row.shortestTrackInSeconds.split(":")[0] * 60 +
        +row.shortestTrackInSeconds.split(":")[1];
      row.longestTrackInSeconds =
        +row.longestTrackInSeconds.split(":")[0] * 60 +
        +row.longestTrackInSeconds.split(":")[1];

      if (!albumURIs.includes(row.spotifyURI)) {
        results.push(row);
      }
    })
    .on("done", err => {
      if (err) {
        console.log("err =", err);
      } else {
        if (results.length > 0) {
          Albums.insertMany(results)
            .then(saved => {
              sendResponse(res, 200, { data: saved.slice(0, 30) });
              return;
            })
            .catch(err => {
              console.log("err =", err);

              sendResponse(res, 400, "ISSUE SAVING NEW ALBUMS");
              return;
            });
        } else {
          sendResponse(res, 203, "NO NEW ALBUMS TO SAVE");
        }
      }
    })
    .on("error", error => {
      sendResponse(res, 400, error);
      return
    });
};


