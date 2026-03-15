import mongoose from "mongoose";

const BookTransactionSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookName: {
      type: String,
      required: true,
    },
    borrowerName: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["issued", "reserved", "returned"],
      default: "issued",
    },
    fromDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    toDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    transactionStatus: {
      type: String,
      enum: ["active", "completed", "overdue", "reserved"],
      default: "active",
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    finePerDay: {
      type: Number,
      default: 5, // ₹5 per day overdue
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual to check if overdue
BookTransactionSchema.virtual("isOverdue").get(function () {
  if (this.transactionStatus === "completed") return false;
  return new Date() > this.toDate;
});

// Method to calculate fine
BookTransactionSchema.methods.calculateFine = function () {
  if (this.transactionStatus === "completed" || new Date() <= this.toDate) {
    return 0;
  }
  const diffTime = Math.abs(new Date() - this.toDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * this.finePerDay;
};

// Enable virtuals in JSON
BookTransactionSchema.set("toJSON", { virtuals: true });
BookTransactionSchema.set("toObject", { virtuals: true });

export default mongoose.model("BookTransaction", BookTransactionSchema);
