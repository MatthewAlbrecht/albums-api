const moment = require("moment");
module.exports.buildQueryAndOptions = (req, res, next) => {
  let {
    lessThanListenDate,
    greaterThanListenDate,
    lessThanAlbumLengthInMinutes,
    greaterThanAlbumLengthInMinutes,
    lessThanAlbumYear,
    greaterThanAlbumYear,
    lessThanAlbumTotalTracks,
    greaterThanAlbumTotalTracks,
    lessThanRating,
    greaterThanRating,
    lessThanShortestTrackInSeconds,
    greaterThanShortestTrackInSeconds,
    lessThanLongestTrackInSeconds,
    greaterThanLongestTrackInSeconds,
    hasTitleTrack,
    genres,
    page,
    limit,
    sort,
    search
  } = req.query;

  let options = {};
  let query = {};

  if (lessThanListenDate || greaterThanListenDate) {
    query.listenDate = {};
    if (lessThanListenDate) {
      query.listenDate.$lte = moment(lessThanListenDate).toDate();
    }
    if (greaterThanListenDate) {
      query.listenDate.$gte = moment(greaterThanListenDate).toDate();
    }
  }

  if (lessThanAlbumLengthInMinutes || greaterThanAlbumLengthInMinutes) {
    query.albumLengthInMinutes = {};
    if (lessThanAlbumLengthInMinutes) {
      query.albumLengthInMinutes.$lte = lessThanAlbumLengthInMinutes;
    }
    if (greaterThanAlbumLengthInMinutes) {
      query.albumLengthInMinutes.$gte = greaterThanAlbumLengthInMinutes;
    }
  }

  if (lessThanAlbumYear || greaterThanAlbumYear) {
    query.albumYear = {};
    if (lessThanAlbumYear) {
      query.albumYear.$lte = lessThanAlbumYear;
    }
    if (greaterThanAlbumYear) {
      query.albumYear.$gte = greaterThanAlbumYear;
    }
  }

  if (lessThanAlbumTotalTracks || greaterThanAlbumTotalTracks) {
    query.albumTotalTracks = {};
    if (lessThanAlbumTotalTracks) {
      query.albumTotalTracks.$lte = lessThanAlbumTotalTracks;
    }
    if (greaterThanAlbumTotalTracks) {
      query.albumTotalTracks.$gte = greaterThanAlbumTotalTracks;
    }
  }

  if (lessThanRating || greaterThanRating) {
    query.rating = {};
    if (lessThanRating) {
      query.rating.$lte = lessThanRating;
    }
    if (greaterThanRating) {
      query.rating.$gte = greaterThanRating;
    }
  }

  if (lessThanShortestTrackInSeconds || greaterThanShortestTrackInSeconds) {
    query.shortestTrackInSeconds = {};
    if (lessThanShortestTrackInSeconds) {
      query.shortestTrackInSeconds.$lte = lessThanShortestTrackInSeconds;
    }
    if (greaterThanShortestTrackInSeconds) {
      query.shortestTrackInSeconds.$gte = greaterThanShortestTrackInSeconds;
    }
  }

  if (lessThanLongestTrackInSeconds || greaterThanLongestTrackInSeconds) {
    query.longestTrackInSeconds = {};
    if (lessThanLongestTrackInSeconds) {
      query.longestTrackInSeconds.$lte = lessThanLongestTrackInSeconds;
    }
    if (greaterThanLongestTrackInSeconds) {
      query.longestTrackInSeconds.$gte = greaterThanLongestTrackInSeconds;
    }
  }

  if (genres) {
    genres = genres.split(" ")
    query.genres = {
      $in: genres
    }
  }

  if (hasTitleTrack) {
    query.hasTitleTrack = hasTitleTrack === "true"
  }

  if (search) {
    if (!query.hasOwnProperty('$or')) {
      query.$or = []
    }
    search = search.split(" ")
    console.log('\n=== HERE ===\n');
    ["albumName", "artistName"].forEach(prop => {
      search.forEach(word => {
        query.$or.push({[prop]: {$regex: word, $options: "i"}})
      })
    })
  }

  if (page) {
    options.page = +page;
  }

  if (limit) {
    options.limit = +limit;
  }

  if (sort) {
    options.sort = {};
    sort.split(" ").forEach((item, i) => {
      if (item.substring(0, 1) === "-") {
        options.sort[item.substring(1)] = -1;
      } else {
        options.sort[item] = 1;
      }
    });
  }

  res.locals.query = query;
  res.locals.options = options;
  next();
};
