import cron from "node-cron";
import BookTransaction from "../models/BookTransaction.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendOverdueReminder } from "./emailService.js";

/* ─── Daily Overdue Check — runs every day at 9:00 AM ─── */
export const initCronJobs = () => {
  // Check overdue books daily at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running daily overdue check...");
    try {
      const overdueTransactions = await BookTransaction.find({
        transactionStatus: "active",
        toDate: { $lt: new Date() },
      }).populate("borrowerId", "userFullName email");

      let emailsSent = 0;
      let notificationsCreated = 0;

      for (const txn of overdueTransactions) {
        const diffDays = Math.ceil(
          Math.abs(new Date() - new Date(txn.toDate)) / (1000 * 60 * 60 * 24)
        );
        const fine = diffDays * (txn.finePerDay || 5);
        const borrower = txn.borrowerId;

        if (!borrower) continue;

        // Create in-app notification (avoid duplicates for same day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingNotif = await Notification.findOne({
          userId: borrower._id,
          type: "overdue",
          createdAt: { $gte: today },
          message: { $regex: txn.bookName },
        });

        if (!existingNotif) {
          await Notification.create({
            userId: borrower._id,
            type: "overdue",
            title: "Overdue Book Reminder",
            message: `"${txn.bookName}" is ${diffDays} days overdue. Current fine: ₹${fine}`,
            link: "/my-borrows",
          });
          notificationsCreated++;
        }

        // Send email reminder (only on days 1, 3, 7, 14, 30 to avoid spam)
        if ([1, 3, 7, 14, 30].includes(diffDays)) {
          await sendOverdueReminder(
            borrower.email,
            borrower.userFullName,
            txn.bookName,
            diffDays,
            fine
          );
          emailsSent++;
        }
      }

      console.log(
        `✅ Overdue check complete: ${overdueTransactions.length} overdue, ${emailsSent} emails sent, ${notificationsCreated} notifications created`
      );
    } catch (err) {
      console.error("❌ Overdue cron job failed:", err.message);
    }
  });

  console.log("⏰ Cron jobs initialized (daily overdue check at 9 AM)");
};
