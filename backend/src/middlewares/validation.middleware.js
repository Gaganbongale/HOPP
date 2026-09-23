const { validationResult } = require('express-validator');
const { sendFailure } = require('../utils/responseFormatter');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetail = errors.array().reduce((acc, curr) => {
      acc[curr.path || curr.param] = curr.msg;
      return acc;
    }, {});
    
    return res.status(422).json(
      sendFailure('Validation Error', errorDetail)
    );
  }
  next();
};

module.exports = validate;
