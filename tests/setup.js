// it took stephen longer than 5000ms to run some tests (which is jest's max length to run a test)
// so he added this. But your computer is more performant so you don't need it
// jest.setTimeout(30000);

require('../models/User');

const mongoose = require('mongoose');
const keys = require('../config/keys');

// tell mongoose to tell node.js promises
mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, {useMongoClient: true}); // do second argument to avoid deprecation warning
