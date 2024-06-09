const https = require('https');

module.exports = (req, res) => {
  const url = 'https://www.jotform.com/excel/241601799136056';

  https.get(url, (response) => {
    let data = [];

    response.on('data', (chunk) => {
      data.push(chunk);
    });

    response.on('end', () => {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).send(Buffer.concat(data));
    });
  }).on('error', (err) => {
    res.status(500).send('Internal Server Error');
  });
};
