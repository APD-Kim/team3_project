export default function withAuth(req, res, next) {
  const authToken = req.cookies["authorization"];
  res.locals.isAuthenticated = !!authToken;
  next();
}
