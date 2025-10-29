import type { Booking } from "@shared/schema";

interface EmailService {
  sendBookingConfirmation(booking: Booking): Promise<void>;
}

class ResendEmailService implements EmailService {
  private apiKey: string;
  private adminEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.adminEmail = process.env.ADMIN_EMAIL || "info@jaguarpreservetours.com";
  }

  async sendBookingConfirmation(booking: Booking): Promise<void> {
    if (!this.apiKey) {
      console.log("⚠️ RESEND_API_KEY not configured. Email sending skipped.");
      console.log("Booking details logged:", {
        name: booking.name,
        email: booking.email,
        tour: booking.tourType,
        date: booking.tourDate,
      });
      return;
    }

    const tourLabels: Record<string, string> = {
      "jaguar-preserve": "Jaguar Preserve Tour",
      "maya-ruins": "Maya Ruins Tour",
      "chocolate-making": "Chocolate Making Experience",
      "atm-cave": "ATM Cave Tour",
      "waterfalls-tubing": "Waterfalls & River Tubing",
      "combo-tour": "Day Combo Tour",
      "airport-transfer": "Airport Transfer",
      "custom": "Custom Tour",
    };

    const tourLabel = tourLabels[booking.tourType] || booking.tourType;

    // Email to customer
    const customerEmailHtml = `
      <h2>Thank You for Your Booking Request!</h2>
      <p>Dear ${booking.name},</p>
      <p>We've received your booking request for <strong>${tourLabel}</strong>. Our team will contact you within 24 hours to confirm your adventure.</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Tour:</strong> ${tourLabel}</li>
        <li><strong>Date:</strong> ${booking.tourDate}</li>
        <li><strong>Guests:</strong> ${booking.guestCount}</li>
        ${booking.specialRequests ? `<li><strong>Special Requests:</strong> ${booking.specialRequests}</li>` : ''}
      </ul>
      
      <p>If you have any questions, please contact us:</p>
      <ul>
        <li>Phone: +501 633-4000</li>
        <li>WhatsApp: +501 633-4000</li>
        <li>Email: info@jaguarpreservetours.com</li>
      </ul>
      
      <p>We look forward to showing you the best of Belize!</p>
      <p><strong>Jaguar Preserve Tours Team</strong></p>
    `;

    // Email to admin
    const adminEmailHtml = `
      <h2>New Booking Request</h2>
      <h3>Customer Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${booking.name}</li>
        <li><strong>Email:</strong> ${booking.email}</li>
        <li><strong>Phone:</strong> ${booking.phone}</li>
      </ul>
      
      <h3>Tour Details:</h3>
      <ul>
        <li><strong>Tour:</strong> ${tourLabel}</li>
        <li><strong>Date:</strong> ${booking.tourDate}</li>
        <li><strong>Guests:</strong> ${booking.guestCount}</li>
        ${booking.specialRequests ? `<li><strong>Special Requests:</strong> ${booking.specialRequests}</li>` : ''}
      </ul>
      
      <p><strong>Action Required:</strong> Contact customer within 24 hours to confirm booking.</p>
      <p>Booking ID: ${booking.id}</p>
    `;

    try {
      // Send email to customer
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Jaguar Preserve Tours <bookings@jaguarpreservetours.com>",
          to: [booking.email],
          subject: "Booking Confirmation - Jaguar Preserve Tours",
          html: customerEmailHtml,
        }),
      });

      // Send email to admin
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Jaguar Preserve Tours <bookings@jaguarpreservetours.com>",
          to: [this.adminEmail],
          subject: `New Booking: ${tourLabel} - ${booking.name}`,
          html: adminEmailHtml,
        }),
      });

      console.log("Email confirmations sent successfully");
    } catch (error) {
      console.error("Failed to send emails via Resend:", error);
      throw error;
    }
  }
}

export const emailService: EmailService = new ResendEmailService();
