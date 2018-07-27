const { sendResponse } = require("../utils/responseUtils");
const { lightSelectArray } = require("../utils/arrays");
const csv = require("csvtojson/v1");
const Albums = require("../models/albums");

module.exports.createAlbum = async (req, res, next) => {
  // grab relevent variables
  let { album, listenDate, albumName, artistName, albumLengthInMinutes, albumYear, albumTotalTracks, genres, recomendedBy, rating, hasTitleTrack, shortestTrackInSeconds, longestTrackInSeconds, spotifyURI, orderNumber } = req.body;

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
  Albums.create({ spotifyAlbumData: album, listenDate, albumName, artistName, albumLengthInMinutes, albumYear, albumTotalTracks, genres, recomendedBy, rating, hasTitleTrack, shortestTrackInSeconds, longestTrackInSeconds, spotifyURI, orderNumber })
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
  if (req.query.light === "true") {
    res.locals.options = {...res.locals.options, select: lightSelectArray}
  }
  console.log('\n---> res.locals.query <---\n', res.locals.query, '\n');
  Albums.paginate(res.locals.query || {}, res.locals.options)
    .then(docs => {
      sendResponse(res, 200, docs);
      return;
    })
    .catch(err => {
      sendResponse(res, 400, err);
      return;
    });
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
