const mongoose = require ("mongoose"); // The reason for this demo.
const dbURI = process.env.MONGODB_URI || undefined

mongoose.connect(dbURI, {})

mongoose.connection.on('connected', () => {
   console.log("++++ Mongoose connected to " + dbURI )
})

mongoose.connection.on('error', (err) => {
   console.log("---- Mongoose connection error " + err)
})

mongoose.connection.on('disconnected', () => {
   console.log("---- Mongoose disconnected from " + dbURI )
})

let gracefulShutdown = (msg, callback) => {
   mongoose.connection.close(() => {
      console.log("---- Mongoose disconnected through " + msg);
      callback()
   })
}

//for nodeman restarts
process.once('SIGUSR2', () => {
   gracefulShutdown('nodemon restart', () => {
      process.kill(process.pid, 'SIGUSR2')
   })
})

//for app termination
process.on('SIGINT', () => {
   gracefulShutdown('app termination', () => {
      process.exit(0)
   })
})

//for Heroku app termination
process.on('SIGTERM', () => {
   gracefulShutdown('Heroku app shutdown', () => {
      process.exit(0)
   })
})
