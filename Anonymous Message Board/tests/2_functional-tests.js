const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    const board = 'testboard';
    let threadId;
    let replyId;
    const threadPassword = 'secure123';
    const replyPassword = 'replypass';

    test('Creating a new thread: POST /api/threads/:board', function(done) {
        chai.request(server).post(`/api/threads/${board}`)
            .send({ text: 'Test thread', delete_password: threadPassword })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.property(res.body, 'text');
                assert.property(res.body, '_id');
                assert.exists(res.body._id);
                assert.equal(res.body.text, 'Test thread');
                threadId = res.body._id;
                done();
            });
    });
    
    test('Viewing 10 most recent threads: GET /api/threads/:board', function(done) {
        chai.request(server).get(`/api/threads/${board}`)
            .end((err, res) => {
                assert.equal(res.status, 200);
                if (res.body.length > 0) {
                    assert.property(res.body[0], 'text');
                    assert.property(res.body[0], '_id');
                    assert.exists(res.body[0].replies);
                    assert.isAtMost(res.body[0].replies.length, 3);
                }
                assert.isArray(res.body);
                assert.isAtMost(res.body.length, 10);
                done();
            });
    });
    
    test('Deleting thread with incorrect password: DELETE /api/threads/:board', function(done) {
        chai.request(server).delete(`/api/threads/${board}`)
            .send({ thread_id: threadId, delete_password: 'wrongpass' })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
            });
    });
    
    test('Deleting thread with correct password: DELETE /api/threads/:board', function(done) {
        chai.request(server).post(`/api/threads/${board}`)
            .send({ text: 'Thread to delete', delete_password: threadPassword })
            .end((err, res) => {
                const tempId = res.body._id;
                chai.request(server).delete(`/api/threads/${board}`)
                    .send({ thread_id: tempId, delete_password: threadPassword })
                    .end((err2, res2) => {
                        assert.equal(res2.status, 200);
                        assert.equal(res2.text, 'success');
                        done();
                    });
            });
    });
    
    test('Reporting a thread: PUT /api/threads/:board', function(done) {
        chai.request(server).put(`/api/threads/${board}`)
            .send({ thread_id: threadId })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'reported');
                done();
            });
    });        

    test('Creating a new reply: POST /api/replies/:board', function(done) {
        chai.request(server).post(`/api/replies/${board}`)
            .send({ 
                thread_id: threadId,
                text: 'Test reply',
                delete_password: replyPassword 
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.property(res.body, 'text');
                assert.property(res.body, '_id');
                assert.exists(res.body._id);
                assert.equal(res.body.text, 'Test reply');
                replyId = res.body._id;
                done();
            });
    });  
    
    test('Viewing a single thread: GET /api/replies/:board', function(done) {
        chai.request(server).get(`/api/replies/${board}`)
            .query({ thread_id: threadId })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.property(res.body, 'text');
                assert.property(res.body, '_id');
                assert.equal(res.body._id, threadId);
                assert.isArray(res.body.replies);
                assert.isAbove(res.body.replies.length, 0);
                assert.equal(res.body.replies[0].text, 'Test reply');
                done();
            });
    });  
    
    test('Deleting reply with incorrect password: DELETE /api/replies/:board', function(done) {
        chai.request(server).delete(`/api/replies/${board}`)
            .send({ 
                thread_id: threadId,
                reply_id: replyId,
                delete_password: 'wrongpass' 
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
            });
    });  
    
    test('Deleting reply with correct password: DELETE /api/replies/:board', function(done) {
        chai.request(server).delete(`/api/replies/${board}`)
            .send({ 
                thread_id: threadId,
                reply_id: replyId,
                delete_password: replyPassword 
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            });
    }); 
    
    test('Reporting a reply: PUT /api/replies/:board', function(done) {
        chai.request(server).post(`/api/replies/${board}`)
            .send({ 
                thread_id: threadId,
                text: 'Reply to report',
                delete_password: replyPassword 
            })
            .end((err, res) => {
                const newReplyId = res.body._id;
                chai.request(server).put(`/api/replies/${board}`)
                    .send({
                        thread_id: threadId,
                        reply_id: newReplyId
                    })
                    .end((err2, res2) => {
                        assert.equal(res2.status, 200);
                        assert.equal(res2.text, 'reported');
                        done();
                    });
            });
    }); 
});
