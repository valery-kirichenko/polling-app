const Ajv = require('ajv');
const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
const schema = require('./vote.schema.json');
const shortid = require('shortid');

const environment = process.env.NODE_ENV || 'production';
const db_settings = require('./../config.json')[environment];
const client = new MongoClient(db_settings.url);


module.exports = (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.method !== 'POST') {
        res.end(JSON.stringify({success: false, error: "Only POST method is supported"}));
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            req.body = JSON.parse(body);
        } catch (err) {
            res.end(JSON.stringify({success: false, error: "Invalid JSON was sent"}));
            return;
        }

        client.connect((err) => {
            if (err !== null) {
                res.end(JSON.stringify({success: false, error: "Can't connect to the database"}));
                return;
            }

            const db = client.db('polls');
            const collection = db.collection(db_settings.collection);

            let ajv = new Ajv();
            let validate = ajv.compile(schema);

            if (!validate(req.body)) {
                res.end(JSON.stringify({success: false, error: "Invalid JSON"}));
                return;
            }

            let poll = req.body;

            let id;
            let is_short = false;
            try {
                if (poll.id.match(/^[0-9a-f]{24}$/) !== null) {
                    id = ObjectID(poll.id);
                } else {
                    id = poll.id;
                    is_short = true;
                }
            } catch (err) {
                res.end(JSON.stringify({success: false, error: "Invalid id"}));
                return;
            }

            let filter;
            if (is_short) {
                filter = {'shortid': id};
            } else {
                filter = {'_id': id};
            }

            collection.findOne(filter, (err, result) => {
                if (err !== null || result === null|| poll.option >= result.options.length) {
                    res.end(JSON.stringify({success: false, error: "Invalid request"}));
                } else {
                    collection.updateOne(filter, {$inc: {[`options.${poll.option}.votes`]: 1}}, (err, result) => {
                        if (err !== null) {
                            res.end(JSON.stringify({success: false, error: "Invalid request"}));
                        } else {
                            res.end(JSON.stringify({success: true}));
                        }
                    });
                }
            });
        });
    });
}
