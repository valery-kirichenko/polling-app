const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('./app.js');
const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);
let poll_id;

describe('/api/latest', function() {
    it('should list up to 5 latest polls', function(done) {
        chai.request(server)
        .get('/api/latest')
        .end(function(err, res) {
            expect(res.body.success).to.be.true;
            res.body.polls.should.have.lengthOf.at.most(5);
            done();
        });
    });
});

describe('/api/create', function() {
    it('should not allow empty request body', function(done) {
        chai.request(server)
        .post('/api/create')
        .send({})
        .end(function(err, res) {
            expect(res.body.success).to.be.false;
            done();
        });
    });

    it('should not allow empty title', function(done) {
        chai.request(server)
        .post('/api/create')
        .send({'title': '', 'options': ['1', '2']})
        .end(function(err, res) {
            expect(res.body.success).to.be.false;
            done();
        });
    });

    it('should not allow less than 2 options', function(done) {
        chai.request(server)
        .post('/api/create')
        .send({'title': 'Test', 'options': ['1']})
        .end(function(err, res) {
            expect(res.body.success).to.be.false;
            done();
        });
    });

    it('should create appropriate poll', function(done) {
        chai.request(server)
        .post('/api/create')
        .send({'title': 'Test', 'options': ['1', '2']})
        .end(function(err, res) {
            expect(res.body.success).to.be.true;
            res.body.should.have.property('id');
            poll_id = res.body.id;
            done();
        });
    });
});

describe('/api/vote', function() {
    it('should not allow incorrect poll id', function(done) {
        chai.request(server)
        .post('/api/vote')
        .send({'id': '1', 'option': 0})
        .end(function(err, res) {
            expect(res.body.success).to.be.false;
            done();
        });
    });

    it('should not allow voting for non-existant options', function(done) {
        chai.request(server)
        .post('/api/vote')
        .send({'id': poll_id, 'option': 2})
        .end(function(err, res) {
            expect(res.body.success).to.be.false;
            done();
        });
    });

    it('should successfuly vote', function(done) {
        chai.request(server)
        .post('/api/vote')
        .send({'id': poll_id, 'option': 0})
        .end(function(err, res) {
            expect(res.body.success).to.be.true;
            done();
        });
    });
});
