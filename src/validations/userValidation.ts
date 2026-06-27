import { body } from 'express-validator';

export const createAdminValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username (email) is required')
    .isEmail()
    .withMessage('Username must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('eid')
    .trim()
    .notEmpty()
    .withMessage('EID is required'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),

  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
];

export const updateAdminValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('eid')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('EID cannot be empty'),

  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty'),

  body('phoneNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty'),

  body('password')
    .optional()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
];

export default {
  createAdminValidation,
  updateAdminValidation,
};
