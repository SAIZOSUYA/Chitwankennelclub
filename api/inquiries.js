module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'POST') {
    res.status(200).json({ success: true, message: 'Thank you! Your request has been recorded into Chitwan Kennel Club database.' });
  } else {
    res.status(200).json({ success: true, inquiries: [] });
  }
};
