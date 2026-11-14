const { validationResult } = require('express-validator');

/** Runs after express-validator chains; responds 400 with the first error as `error`. */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array();
  return res.status(400).json({
    error: errors[0].msg,
    details: errors.map(({ path, msg }) => ({ field: path, message: msg })),
  });
}

module.exports = validate;
