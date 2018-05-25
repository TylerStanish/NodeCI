const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}){
  // 'this' is equal to the query instance
  this.useCache = true;
  // we stringify to make sure it's a string or a number
  this.hashKey = JSON.stringify(options.key || '');
  return this;
}

mongoose.Query.prototype.exec = async function(){
  // 'this' is a reference to the current query
  // we must make a copy of what is returned from this.getQuery() because when we modify it it will modify the original!

  if(!this.useCache){
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(Object.assign({}, this.getQuery(), {collection: this.mongooseCollection.name}));

  const cachedValue = await client.hget(this.hashKey, key);
  if(cachedValue){

    const doc = JSON.parse(cachedValue);

    // this is known as hydrating
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  console.log(key);
  const result = await exec.apply(this, arguments);
  // 'result' is a 'model instance,' not a plain JS object
  console.log(result, 'the result');

  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

  return result;
}

module.exports = {
  clearHash(hashKey){
    client.del(JSON.stringify(hashKey));
  }
}
