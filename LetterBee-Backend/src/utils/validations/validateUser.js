import Joi from "joi";

// 🔹 Register validation
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    userName: Joi.string().required(),
    password: Joi.string().min(8).required(),
    about: Joi.string().allow("", null),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }
  next();
};

// 🔹 Login validation
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email(),
    userName: Joi.string(),
    password: Joi.string().required(),
  }).or("email", "userName");

  const { error } =
    schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message:
        error.details[0].message,
    });
  }
  next();
};

export { validateRegister, validateLogin };