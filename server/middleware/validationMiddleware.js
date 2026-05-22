const MONGO_ID_PATTERN = /^[a-f\d]{24}$/i;
const EMAIL_PATTERN = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;

function isPresent(value) {
  return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');
}

function pushError(errors, source, field, message) {
  errors.push({ source, field, message });
}

function normalizeString(value, rule) {
  return rule.trim === false ? value : value.trim();
}

function validateValue(data, source, field, rule, errors) {
  let value = data[field];

  if (!isPresent(value)) {
    if (rule.required) {
      pushError(errors, source, field, rule.message || `${field} is required`);
    }
    return;
  }

  if (typeof value === 'string') {
    value = normalizeString(value, rule);
    data[field] = value;
  }

  if (rule.type === 'string' || rule.type === 'email' || rule.type === 'password' || rule.type === 'url') {
    if (typeof value !== 'string') {
      pushError(errors, source, field, `${field} must be a string`);
      return;
    }

    if (rule.minLength && value.length < rule.minLength) {
      pushError(errors, source, field, `${field} must be at least ${rule.minLength} characters`);
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      pushError(errors, source, field, `${field} must be at most ${rule.maxLength} characters`);
    }
  }

  if (rule.type === 'email') {
    data[field] = value.toLowerCase();
    if (!EMAIL_PATTERN.test(data[field])) {
      pushError(errors, source, field, `${field} must be a valid email address`);
    }
  }

  if (rule.type === 'url') {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        pushError(errors, source, field, `${field} must use http or https`);
      }
    } catch (error) {
      pushError(errors, source, field, `${field} must be a valid URL`);
    }
  }

  if (rule.type === 'number' || rule.type === 'integer') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      pushError(errors, source, field, `${field} must be a number`);
      return;
    }

    if (rule.type === 'integer' && !Number.isInteger(parsed)) {
      pushError(errors, source, field, `${field} must be an integer`);
    }

    if (rule.min !== undefined && parsed < rule.min) {
      pushError(errors, source, field, `${field} must be at least ${rule.min}`);
    }

    if (rule.max !== undefined && parsed > rule.max) {
      pushError(errors, source, field, `${field} must be at most ${rule.max}`);
    }

    data[field] = parsed;
  }

  if (rule.type === 'boolean') {
    if (typeof value === 'boolean') return;
    if (value === 'true' || value === 'false') {
      data[field] = value === 'true';
      return;
    }
    pushError(errors, source, field, `${field} must be true or false`);
  }

  if (rule.type === 'array') {
    if (!Array.isArray(value)) {
      pushError(errors, source, field, `${field} must be an array`);
      return;
    }

    if (rule.items === 'string') {
      data[field] = value
        .map(item => (typeof item === 'string' ? item.trim() : item))
        .filter(item => item !== '');

      if (data[field].some(item => typeof item !== 'string')) {
        pushError(errors, source, field, `${field} must only include strings`);
      }
    }

    const normalizedArray = data[field];
    if (rule.minItems !== undefined && normalizedArray.length < rule.minItems) {
      pushError(errors, source, field, `${field} must include at least ${rule.minItems} item`);
    }

    if (rule.maxItems !== undefined && normalizedArray.length > rule.maxItems) {
      pushError(errors, source, field, `${field} must include at most ${rule.maxItems} items`);
    }
  }

  if (rule.type === 'mongoId' && !MONGO_ID_PATTERN.test(String(value))) {
    pushError(errors, source, field, `${field} must be a valid id`);
  }

  if (rule.enum && !rule.enum.includes(data[field])) {
    pushError(errors, source, field, `${field} must be one of: ${rule.enum.join(', ')}`);
  }
}

function validateSection(data, source, rules, errors) {
  Object.entries(rules || {}).forEach(([field, rule]) => {
    validateValue(data, source, field, rule, errors);
  });
}

function hasKnownBodyField(body, rules) {
  return Object.keys(rules || {}).some(field => isPresent(body[field]));
}

function validateRequest(schemas, options = {}) {
  return (req, res, next) => {
    const errors = [];

    validateSection(req.body || {}, 'body', schemas.body, errors);
    validateSection(req.params || {}, 'params', schemas.params, errors);
    validateSection(req.query || {}, 'query', schemas.query, errors);

    if (options.requireAtLeastOneBodyField && !hasKnownBodyField(req.body || {}, schemas.body)) {
      pushError(errors, 'body', 'body', 'At least one editable field is required');
    }

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    return next();
  };
}

const rules = {
  string: options => ({ type: 'string', ...options }),
  email: options => ({ type: 'email', ...options }),
  password: options => ({ type: 'password', minLength: 6, ...options }),
  number: options => ({ type: 'number', ...options }),
  integer: options => ({ type: 'integer', ...options }),
  boolean: options => ({ type: 'boolean', ...options }),
  array: options => ({ type: 'array', ...options }),
  enum: (values, options = {}) => ({ enum: values, ...options }),
  url: options => ({ type: 'url', ...options }),
  mongoId: options => ({ type: 'mongoId', ...options }),
};

module.exports = {
  validateRequest,
  rules,
};
