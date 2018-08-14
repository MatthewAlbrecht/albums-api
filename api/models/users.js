var mongoose =  require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: '{PATH} is required'
  },
  password: {
    type: String,
    required: '{PATH} is required'
  },
  spotifyUserData: {
    type: Object
  }
}, { timestamps: true })

userSchema.plugin(mongoosePaginate);
userSchema.index({albumName: "text", artistName: "text", genres: "text"})
userSchema.index({spotifyURI: 1}, {unique: true})
userSchema.index({orderNumber: 1}, {unique: true})

module.exports = mongoose.model("Users", userSchema)
