'use strict';
const { randomUUID } = require('crypto');

module.exports = function (app) {
  const boards = {};

  const sanitizeThread = thread => ({
    _id: thread._id,
    text: thread.text,
    created_on: thread.created_on,
    bumped_on: thread.bumped_on,
    replies: thread.replies.slice(-3).map(r => ({
      _id: r._id,
      text: r.text,
      created_on: r.created_on
    }))
  });
  
  const sanitizeFullThread = thread => ({
    _id: thread._id,
    text: thread.text,
    created_on: thread.created_on,
    bumped_on: thread.bumped_on,
    replies: thread.replies.map(r => ({
      _id: r._id,
      text: r.text,
      created_on: r.created_on
    }))
  });

  app.route('/api/threads/:board')
     .post((req, res) => {
      const { text, delete_password } = req.body;
      const now = new Date();
      const thread = {
        _id: randomUUID(),
        text,
        delete_password,
        created_on: now,
        bumped_on: now,
        reported: false,
        replies: []
      };

      boards[req.params.board] = boards[req.params.board] || [];
      boards[req.params.board].push(thread);

      res.json(thread);
     })
     .get((req, res) => {
      const boardThreads = boards[req.params.board] || [];
      const sorted = [...boardThreads].sort((a, b) => b.bumped_on - a.bumped_on).slice(0, 10);

      res.json(sorted.map(sanitizeThread));
     })
     .delete((req, res) => {
      const { thread_id, delete_password } = req.body;
      const boardThreads = boards[req.params.board] || [];
      const index = boardThreads.findIndex(t => t._id === thread_id);
      
      if (index === -1 || boardThreads[index].delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      boardThreads.splice(index, 1);
      res.send('success');
     })
     .put((req, res) => {
      const { thread_id } = req.body;
      const boardThreads = boards[req.params.board] || [];
      const thread = boardThreads.find(t => t._id === thread_id);

      if (!thread) return res.send('Thread not found');

      thread.reported = true;
      res.send('reported');
     });
    
  app.route('/api/replies/:board')
     .post((req, res) => {
      const { text, delete_password, thread_id } = req.body;
      const boardThreads = boards[req.params.board] || [];
      const thread = boardThreads.find(t => t._id === thread_id);

      if (!thread) return res.send('Thread not found');

      const reply = {
        _id: randomUUID(),
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(reply);
      thread.bumped_on = reply.created_on;

      res.json(reply);
     })
     .get((req, res) => {
      const { thread_id } = req.query;
      const boardThreads = boards[req.params.board] || [];
      const thread = boardThreads.find(t => t._id === thread_id);

      if (!thread) return res.send('Thread not found');

      res.json(sanitizeFullThread(thread));
     })
     .delete((req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const boardThreads = boards[req.params.board] || [];
      const thread = boardThreads.find(t => t._id === thread_id);

      if (!thread) return res.send('Thread not found');

      const reply = thread.replies.find(r => r._id === reply_id);

      if (!reply || reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      reply.text = '[deleted]';
      res.send('success');
     })
     .put((req, res) => {
      const { thread_id, reply_id } = req.body;
      const boardThreads = boards[req.params.board] || [];
      const thread = boardThreads.find(t => t._id === thread_id);

      if (!thread) return res.send('Thread not found');

      const reply = thread.replies.find(r => r._id === reply_id);

      if (!reply) return res.send('Reply not found');

      reply.reported = true;
      res.send('reported');
     });
};
