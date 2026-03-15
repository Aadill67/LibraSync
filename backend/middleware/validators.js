import { body, param, validationResult } from "express-validator";

/* ─── Helper: run validations and return 400 if errors ───── */
const validate = (validations) => async (req, res, next) => {
  for (const v of validations) await v.run(req);
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({
    message: "Validation failed",
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

/* ─── Auth Validators ─────────────────────────────────────── */
export const validateRegister = validate([
  body("userFullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["admin", "librarian", "member"]).withMessage("Role must be admin, librarian, or member"),
  body("mobileNumber").optional().matches(/^[0-9]{10}$/).withMessage("Valid 10-digit mobile number is required"),
]);

export const validateSignin = validate([
  body("password").notEmpty().withMessage("Password is required"),
  body().custom((_, { req }) => {
    if (!req.body.email && !req.body.admissionId && !req.body.employeeId) {
      throw new Error("Email, Admission ID, or Employee ID is required");
    }
    return true;
  }),
]);

/* ─── Book Validators ─────────────────────────────────────── */
export const validateAddBook = validate([
  body("bookName").trim().notEmpty().withMessage("Book name is required"),
  body("author").trim().notEmpty().withMessage("Author is required"),
  body("bookCountAvailable")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Available count must be 0 or more"),
]);

/* ─── Transaction Validators ──────────────────────────────── */
export const validateAddTransaction = validate([
  body("bookId").isMongoId().withMessage("Valid book ID is required"),
  body("borrowerId").isMongoId().withMessage("Valid borrower ID is required"),
]);

export const validateTransactionId = validate([
  param("id").isMongoId().withMessage("Valid transaction ID is required"),
]);

/* ─── Generic Mongo ID param validator ────────────────────── */
export const validateMongoId = validate([
  param("id").isMongoId().withMessage("Valid ID is required"),
]);
