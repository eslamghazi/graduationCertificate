const https = require('https');

module.exports = (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('No URL provided');
  }

  https.get(url, (response) => {
    let data = [];

    response.on('data', (chunk) => {
      data.push(chunk);
    });

    response.on('end', () => {
      res.setHeader('Content-Type', response.headers['content-type']);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).send(Buffer.concat(data));
    });
  }).on('error', (err) => {
    res.status(500).send('Internal Server Error');
  });
};
