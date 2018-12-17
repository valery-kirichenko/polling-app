const http = require('http')
const create = require('./api/create.js');
const latest = require('./api/latest.js');
const vote = require('./api/vote.js');
const details = require('./api/details.js');
const static = require('node-static');
const file = new static.Server('./static');
const URL = require('url').URL;
const port = 3000

const requestHandler = (request, response) => {


    const url = new URL(request.url, 'http://127.0.0.1/');
    console.log(url.pathname)

    let served = false;

    if (url.pathname.includes('results')) {
        file.serveFile('/details.html', 200, {}, request, response);
        served = true;
    }

    switch (url.pathname) {
        case "/api/latest":
            latest(request, response);
            served = true;
            break;
        case "/api/create":
            create(request, response);
            served = true;
            break;
        case '/api/details':
            details(request, response);
            served = true;
            break;
        case '/api/vote':
            vote(request, response);
            served = true;
            break;
        default:
            if (url.pathname.includes('css') || url.pathname.includes('js') || url.pathname.match(/\//g).length === 1) {
                file.serve(request, response);
                served = true;
            }
            break;
    }

    if (served !== true) {
        file.serveFile('/vote.html', 200, {}, request, response);
    }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${port}`)
});

module.exports = server;