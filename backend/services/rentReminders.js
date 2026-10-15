const RentAgreement = require("../models/RentAgreement");
const Notification = require("../models/Notification");

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Sends 5-days-before, due-date and overdue reminders for active rent agreements.
 * Each reminder type is sent at most once per payment date.
 * @returns {{ processed: number, totalAgreements: number }}
 */
const processRentReminders = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const agreements = await RentAgreement.find({ status: "ACTIVE" }).populate("owner tenant property");
  let processed = 0;

  for (const agreement of agreements) {
    if (!agreement.owner || !agreement.tenant || !agreement.property) continue;

    const dueDate = new Date(agreement.nextPaymentDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate - today) / DAY_MS);

    const alreadySent = (type) =>
      (agreement.remindersSent || []).some(
        (r) => r.type === type && new Date(r.forPaymentDate).getTime() === dueDate.getTime()
      );

    const amount = `₹${agreement.rentAmount.toLocaleString("en-IN")}`;
    let reminderType = null;
    let message = null;

    if (daysUntilDue === 5 && !alreadySent("5_DAYS_BEFORE")) {
      reminderType = "5_DAYS_BEFORE";
      message = `Rent of ${amount} is due in 5 days for ${agreement.property.title}`;
    } else if (daysUntilDue === 0 && !alreadySent("DUE_DATE")) {
      reminderType = "DUE_DATE";
      message = `Rent of ${amount} is due today for ${agreement.property.title}`;
    } else if (daysUntilDue < 0 && agreement.paymentStatus !== "PAID" && !alreadySent("OVERDUE")) {
      reminderType = "OVERDUE";
      message = `Rent of ${amount} for ${agreement.property.title} is overdue by ${Math.abs(daysUntilDue)} day(s)`;
      agreement.paymentStatus = "OVERDUE";
    }

    if (!reminderType) continue;

    await Notification.create([
      {
        from: agreement.owner._id,
        to: agreement.tenant._id,
        property: agreement.property._id,
        action: `RENT_${reminderType}`,
        message
      },
      {
        from: agreement.tenant._id,
        to: agreement.owner._id,
        property: agreement.property._id,
        action: `RENT_${reminderType}`,
        message: `${agreement.tenant.name || "Tenant"}: ${message}`
      }
    ]);

    agreement.remindersSent.push({ type: reminderType, sentAt: new Date(), forPaymentDate: dueDate });
    agreement.lastReminderSent = new Date();
    await agreement.save();
    processed++;
  }

  return { processed, totalAgreements: agreements.length };
};

module.exports = { processRentReminders };
