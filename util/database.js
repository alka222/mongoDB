const mongodb = require('mongodb')
const MongoClient=mongodb.MongoClient;

let _db;

const mongoConnect = (callback)=>{
    MongoClient.connect('mongodb+srv://alka222:wXNq9uiPa3w46VTy@cluster0.dbbju49.mongodb.net/shop?retryWrites=true&w=majority')
    .then(client=>{
        console.log('Connected!');
        _db = client.db();
        callback();
    })

    .catch(err=>{
        console.log(err);
        throw err;
    });
}


const getDb = () => {
    if (_db) {
      return _db;
    }
    throw 'No database found!';
  };
  
  exports.mongoConnect = mongoConnect;
  exports.getDb = getDb;
