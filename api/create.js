const Ajv = require('ajv');
const escape = require('escape-html');
const MongoClient = require('mongodb').MongoClient;
const schema = require('./create.schema.json');
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
            
            let req_poll = req.body;
            let in_use = false;
            let generated_id;
            if (req_poll.hasOwnProperty('custom_url')) {
                generated_id = req_poll.custom_url;
            } else {
                generated_id = shortid.generate();
            }
            
            collection.findOne({'shortid': generated_id}, {projection: {"_id": true}}, (err, result) => {
                if (err !== null) {
                    res.end(JSON.stringify({success: false, error: "Can't proceed database request (checking id for duplicates)"}));
                } else {
                    if (result !== null) {
                        res.end(JSON.stringify({success: false, error: "Address is already in use"}));
                        in_use = true;
                    }
                }
            });

            if (in_use) {
                return;
            }
            
            let poll = {title: escape(req_poll.title.trim()),
                options: req_poll.options.map(option => {return {title: escape(option.trim()), votes: 0}}),
                timestamp: Date.now(),
                shortid: generated_id};
                
                collection.insertOne(poll, (err, r) => {
                    if (err !== null) {
                        res.end(JSON.stringify({success: false, error: err}));
                    } else {
                        res.end(JSON.stringify({success: true, id: r.insertedId, short: generated_id}));
                    }
                });
            });
        });
    }
    