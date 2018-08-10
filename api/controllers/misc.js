const { sendResponse } = require("../utils/responseUtils");
const Albums = require("../models/albums");
const rp = require("request-promise");
let querystring = require("querystring");
let { lightProjectObject } =  require('../utils/arrays')

let accessToken =
"BQBF7ri0sIXVvQaVlYygrPWT6JJVMLaUarV70OcxtIrkBbkluOtdcTgOioBAKC4IhzL4as16euGcVEK1dhECohmWnhKQzJXJX5s2jLutsB4vkDJxTjCTF83iQnB_w8idN7f4JpAesiPS5SSzLSDelinsIqC77jgw";
module.exports.spotifyData = async (req, res, next) => {
  let albums;
  try {
    albums = await Albums.find({});
  } catch (error) {
    sendResponse(res, 400, error);
    return;
  }
  
  let qsArrays = [],
  promises = [];
  let spotifyURIs = albums
  .filter(album => !album.spotifyAlbumData)
  .map(album => album.spotifyURI);
  
  while (spotifyURIs.length) {
    qsArrays.push(spotifyURIs.splice(0, 20));
  }
  
  let spotifyAlbums;
  promises = qsArrays.map(async qs => {
    querystring.stringify({ ids: qs });
    let authOptions = {
      url:
      "https://api.spotify.com/v1/albums?" +
      querystring.stringify({ ids: qs.join(",") }),
      method: "get",
      headers: {
        Authorization: "Bearer " + accessToken
      },
      json: true
    };
    return rp(authOptions);
  });
  
  try {
    spotifyAlbums = await Promise.all(promises);
  } catch (error) {
    sendResponse(res, 400, error);
    return;
  }
  
  spotifyAlbums = [].concat(...spotifyAlbums.map(el => el.albums));
  promises = [];
  albums = albums
  .map(album => {
    let uri = album.spotifyURI;
    // console.log('\n---> album.albumName <---\n', album.albumName, '\n');
    album.spotifyAlbumData = spotifyAlbums.find(spotifyAlbum => {
      if (!spotifyAlbum) {
        // console.log('\n=== HERE ===\n');
      }
      return spotifyAlbum.uri.includes(uri)
    }
  );
  return album;
})
.forEach(album => {
  album = new Albums(album);
  promises.push(album.save());
});

let savedAlbums;
try {
  savedAlbums = await Promise.all(promises);
} catch (error) {
  sendResponse(res, 400, error);
}

sendResponse(res, 200, savedAlbums[0]);
};

module.exports.getGenres = async (req, res, next) => {
  let genres;
  try {
    genres = await Albums
    .find({})
    .distinct("genres")
    .lean();
  } catch (error) {
    sendResponse(res, 400, error);
  }
  genres = genres.sort(alphabetize)
  sendResponse(res, 200, {docs: genres});
};

function alphabetize(a, b) {
  if(a < b) return -1;
  if(a > b) return 1;
  return 0;
}

module.exports.test = (req, res, next) => {
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
}

const getMean = (array) => array.reduce((object, element, i) => {
  if (object.hasOwnProperty(element)) {
    object[element]++
  } else {
    object[element] = 1
  }
  if (array.length - 1 === i) {
    let result = { prop: null, value: null }
    for (const prop in object) {
      const value = object[prop];
      result = !result.value ? { prop, value } : value > result.value ? { prop, value } : result 
    }
    return result.prop
  }
  return object
}, {})