const mongoose = require('mongoose');
const morgan = require('morgan');
const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const config = require('config');
const socketIo = require('socket.io');
const path = require('path');

const users = require('./routes/users');
const admin = require('./routes/admin');
const city = require('./routes/city');
const categoties = require('./routes/categories');
const skills = require('./routes/skills');
const rating = require('./routes/rating');
const UserRequest = require('./routes/UserRequest');
const bid = require('./routes/bid');
const workers = require('./routes/Worker');
const search = require('./routes/search');
const utility = require('./routes/utility');

const server = require('./server');

const basicAuth = require('express-basic-auth'); // for swagger auth

// mongoDB connection
const mongoString = config.get('mongoURI');
mongoose.connect(
  mongoString,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useCreateIndex: true,
  },
  (err) => {
    if (err) console.log('Some problem with the connection ' + err);
    else console.log(`The Mongoose connection is ready`);
  }
);

mongoose.connection.on('connected', () => console.log('Connected DB'));
mongoose.connection.on('error', (err) => console.log(`Error:  ${err}`));
mongoose.connection.on('disconnected', () => console.log('DIsconnected DB'));

// close mongo connection on server closing
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

const app = express();
app.use(morgan('dev')); // console log all requests
app.use(cors()); // corss origin resource sharing
app.use(express.json()); // json data
app.use(express.urlencoded({ extended: true })); // for form data

/**
 * @swagger
 * /:
 *  get:
 *    description: Hello world route for testing of APIs, dummy route for testing.
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get('/', async (req, res, next) => {
  try {
    res.status(200).json({
      result: 'Freelancer backend app',
    });
  } catch (err) {
    next(err);
  }
});

// upload all static images in uploads folder
app.use('/uploads', express.static('uploads'));

// All routes
app.use('/api/users', users);
app.use('/api/admin', admin);
app.use('/api/city', city);
app.use('/api/categories', categoties);
app.use('/api/skills', skills);
app.use('/api/rating', rating);
app.use('/api/UserRequest', UserRequest);
app.use('/api/bid', bid);
app.use('/api/workers', workers);
app.use('/api/search', search);
app.use('/api/utility', utility);

// routes to handle errors
app.use(async (req, res, next) => next(createError.NotFound()));
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

server.appListen(app);
const socketServer = server.getServer();

const io = socketIo(socketServer);

io.on('connection', (socket) => {
  console.log(`Hurrah Socket ${socket.id} Connected`);

  socket.emit('me', socket.id);

  socket.on('disconnect', () => {
    socket.broadcast.emit('callEnded');
  });

  socket.on('callUser', ({ userToCall, signalData, from, name }) => {
    // console.log('Calling User', userToCall);
    // console.log(`from`, from);
    // console.log(`userToCall`, userToCall);
    io.sockets.emit('callUser', {
      signal: signalData,
      receiverId: userToCall,
      from: from,
      name: name,
    });
  });

  socket.on('answerCall', (data) => {
    console.log(`data`, data);
    io.sockets.emit('callAccepted', {
      signal: data.signal,
      to: data.to,
    });
  });
});

module.exports = { io };
