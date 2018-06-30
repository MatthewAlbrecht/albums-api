const { sendResponse } = require('../utils/responseUtils')
module.exports.uploadCSV = (req, res, next) => {
  sendResponse(res, 200, {message: 'hello'})
}