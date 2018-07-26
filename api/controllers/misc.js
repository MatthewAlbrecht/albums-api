const { sendResponse } = require("../utils/responseUtils");
const Albums = require("../models/albums");
const rp = require("request-promise");
let querystring = require('querystring')

let accessToken = "BQC_sPTfAVNBSZ9OrlyTNSScOt4HaxGiL7PIQ2eL_Bw3LZDB6tMMKSm8rxYZROiOXnZ2SHR_QcDBYLqagDv-b8bNNPEr8Jr07EHQnS4oK2TItayzGz_PzLFiemSUqZMyXjW4Rlm-l2cyTGJBed8kXnhRvVas54hT"
module.exports.spotifyData = async (req, res, next) => {
  let albums
  try {
    albums = await Albums.find({})
  } catch (error) {
    sendResponse(res, 400, error)
    return
  }

  let qsArrays = [], promises = []
  let spotifyURIs = albums
    .filter(album => !album.spotifyAlbumData)
    .map(album => album.spotifyURI)

  while(spotifyURIs.length) {
    qsArrays.push(spotifyURIs.splice(0,20))
  }
  
  let spotifyAlbums
  promises = qsArrays.map(async qs => {
    querystring.stringify({ ids: qs })
    let authOptions = {
      url: 'https://api.spotify.com/v1/albums?' + querystring.stringify({ ids: qs.join(",") }),
      method: "get",
      headers: {
        "Authorization": "Bearer " + accessToken
      },
      json: true
    }
    return rp(authOptions)
  })

  try {
    spotifyAlbums = await Promise.all(promises)
  } catch (error) {
    sendResponse(res, 400, error) 
    return   
  }

  spotifyAlbums = [].concat(...spotifyAlbums.map(el => el.albums))
  promises = []
  albums = albums
    .map(album => {
      let uri = album.spotifyURI
      album.spotifyAlbumData = spotifyAlbums.find(spotifyAlbum => spotifyAlbum.uri.includes(uri))
      return album
    })
    .forEach(album => {
      album = new Albums(album)
      promises.push(album.save())
    })
  
  let savedAlbums
  try {
    savedAlbums = await Promise.all(promises)
  } catch (error) {
    sendResponse(res, 400, error)
  }
  
  sendResponse(res, 200, savedAlbums[0])
};
