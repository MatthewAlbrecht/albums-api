const { sendResponse } = require("../utils/responseUtils");
const Albums = require("../models/albums");
const rp = require("request-promise");
let querystring = require("querystring");
let { lightProjectObject } =  require('../utils/arrays')

module.exports.spotifyData = async (req, res, next) => {
  let accessToken = req.headers['spotify-access-token'];
  let albums;
  try {
    albums = await Albums.find({spotifyAlbumData: {$exists: false}});
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