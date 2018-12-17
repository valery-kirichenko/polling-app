const MongoClient = require('mongodb').MongoClient;
const db_url = 'mongodb://admin:RQhRqNDBHV9KG8fu@ds063158.mlab.com:63158/polls';

const environment = process.env.NODE_ENV || 'production';
const db_settings = require('./../config.json')[environment];
const client = new MongoClient(db_settings.url);

module.exports = (req, res) => {
    res.setHeader("Content-Type", "application/json");
    client.connect((err) => {
        if (err !== null) {
            res.end(JSON.stringify({success: false, error: "Can't connect to the database"}));
            return;
        }

        const db = client.db('polls');
        const collection = db.collection(db_settings.collection);
        collection.find({}, {projection: {'_id': true, 'shortid': true, 'title': true}})
        .sort({'timestamp': -1}).limit(5).map(doc => {
            //doc.id = doc._id;
            doc.id = doc.shortid;
            delete doc._id;
            return doc;
        }).toArray(function(err, docs) {
            if (err !== null) {
                res.end(JSON.stringify({success: false, error: "Can't proceed database request"}));
            } else {
                res.end(JSON.stringify({success: true, polls: docs}));
            }
        });
    });
}
