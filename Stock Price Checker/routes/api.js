'use strict';
const fetch = require('node-fetch');
const express = require('express');
const crypto = require('crypto');
const likesDB = {};

function anonymizeIP(ip) {
  if (!ip) return 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

async function getRealPrice(symbol) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
  const response = await fetch(url);
  const data = await response.json();
  return parseFloat(data.latestPrice);
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      const ip = req.ip || req.headers['x-forwarded-for'];
      const anonymizedIP = anonymizeIP(ip);
      const stock = req.query.stock;
      const like = req.query.like === 'true';

      if (!stock) {
        return res.status(400).json({ error: 'Missing stock parameter' });
      }

      const stocks = Array.isArray(stock) ? stock.map(s => s.toUpperCase()) : [stock.toUpperCase()];
      
      try {
        const stockData = await Promise.all(stocks.map(async (symbol) => {
          const price = await getRealPrice(symbol);
          if (!likesDB[symbol]) {
            likesDB[symbol] = new Set();
          }

          if (like && !likesDB[symbol].has(anonymizedIP)) {
            likesDB[symbol].add(anonymizedIP);
          }

          return {
            stock: symbol,
            price,
            likes: likesDB[symbol].size
          }
        }));

        if (stockData.length === 2) {
          return res.json({
            stockData: stocks.map(symbol => {
              const current = stockData.find(s => s.stock === symbol);
              const other = stockData.find(s => s.stock !== symbol);
              return {
                stock: current.stock,
                price: current.price,
                rel_likes: current.likes - other.likes
              }
            })
          });
          }
          res.json({ stockData: stockData[0] });
      } catch (e) {
        console.error('Error fetching stock data:', e.message);
        res.status(500).json({ error: 'Failed to fetch stock price' });
      }
      
    });
    
};
