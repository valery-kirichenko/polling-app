const URL = require('url').URL;
const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
const shortid = require('shortid');

const environment = process.env.NODE_ENV || 'production';
const db_settings = require('./../config.json')[environment];
const client = new MongoClient(db_settings.url);

module.exports = (req, res) => {
    res.setHeader("Content-Type", "application/json");
    let url = new URL(req.url, 'http://127.0.0.1/');
    let id;
    let is_short = false;
    try {
        if (url.searchParams.get('id') === null) throw "Id is null";
        let url_id = url.searchParams.get('id');
        console.log(`url_id: ${url_id}`);
        if (url_id.match(/^[0-9a-f]{24}$/) !== null) {
            id = ObjectID(url.searchParams.get('id'));
        } else {
            id = url.searchParams.get('id');
            is_short = true;
        }
    } catch (err) {
        res.end(JSON.stringify({success: false, error: "Invalid id"}));
        return;
    }
    console.log(`it's short: ${is_short}`);

    client.connect((err) => {
        if (err !== null) {
            res.end(JSON.stringify({success: false, error: "Can't connect to the database"}));
            return;
        }

        const db = client.db('polls');
        const collection = db.collection(db_settings.collection);

        let filter;
        if (is_short) {
            filter = {'shortid': id};
        } else {
            filter = {'_id': id};
        }

        collection.findOne(filter, {projection: {'timestamp': false, "_id": false}}, (err, result) => {
            if (err !== null) {
                res.end(JSON.stringify({success: false, error: "Can't proceed database request"}));
            } else {
                if (result === null) {
                    res.end(JSON.stringify({success: false, error: "Invalid id"}));
                } else {
                    result.total = result.options.reduce((sum, option) => sum + option.votes, 0);
                    res.end(JSON.stringify({success: true, details: result}));
                }
            }
        });
    });
}