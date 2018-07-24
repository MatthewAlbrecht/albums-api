var mongoose =  require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

let albumSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    required: '{PATH} is required'
  },
  listenDate: {
    type: Date,
    required: '{PATH} is required'
  },
  albumName: {
    type: String,
    required: '{PATH} is required'
  },
  artistName: {
    type: String,
    required: '{PATH} is required'
  },
  albumLengthInMinutes: {
    type: Number,
    required: '{PATH} is required'
  },
  albumYear: {
    type: Number,
    required: '{PATH} is required'
  },
  albumTotalTracks: {
    type: Number,
    required: '{PATH} is required'
  },
  genres: {
    type: [String],
    required: '{PATH} is required'
  },
  recomendedBy: {
    type: String,
    required: '{PATH} is required'
  },
  rating: {
    type: Number,
    required: '{PATH} is required'
  },
  hasTitleTrack: {
    type: Boolean,
    required: '{PATH} is required'
  },
  shortestTrackInSeconds: {
    type: Number,
    required: '{PATH} is required'
  },
  longestTrackInSeconds: {
    type: Number,
    required: '{PATH} is required'
  },
  spotifyURI: {
    type: String,
    required: '{PATH} is required'
  }
}, { timestamps: true })

albumSchema.plugin(mongoosePaginate);
albumSchema.index({albumName: "text", artistName: "text", genres: "text"})
albumSchema.index({spotifyURI: 1}, {unique: true})
albumSchema.index({orderNumber: 1}, {unique: true})

module.exports = mongoose.model("Albums", albumSchema)
