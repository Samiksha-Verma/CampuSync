// Gates service-to-service routes that carry no end-user JWT. Every service shares
// the same INTERNAL_SERVICE_SECRET, checked via this header.
const verifyInternalSecret = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];

  if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(401).json({ message: 'Invalid internal service credentials' });
  }

  next();
};

module.exports = { verifyInternalSecret };
