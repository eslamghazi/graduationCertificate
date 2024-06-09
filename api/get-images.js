const https = require('https');

module.exports = (req, res) => {
  // Retrieve the URL from query parameters
  const { url } = req.query;

  // Check if the URL is provided
  if (!url) {
    return res.status(400).send('URL parameter is required');
  }

  // Make the GET request to the provided URL
  https.get(url, (response) => {
    let data = [];

    response.on('data', (chunk) => {
      data.push(chunk);
    });

    response.on('end', () => {
      // Set the appropriate headers
      res.setHeader('Content-Type', 'application/image');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Send the response with the concatenated data
      res.status(200).send(Buffer.concat(data));
    });
  }).on('error', (err) => {
    // Handle errors
    console.error('Error fetching URL:', err.message);
    res.status(500).send('Internal Server Error');
  });
};
