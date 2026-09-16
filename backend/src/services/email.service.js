const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

exports.sendBill = async (order) => {
  if (!order.customerEmail) return;

  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

    const settings = await prisma.settings.findFirst();
    const cafeName = settings?.cafeName || 'The Coffe Concept';
    const footerMsg = settings?.receiptFooter || 'Thank you for dining with us!';

    if (!emailUser || !emailPass) {
      console.log(`[Email Service Mock] Credentials missing. Would send to: ${order.customerEmail}`);
      console.log(`[Email Service Mock] Order Breakdown: #${order.orderNumber}, Total: ₹${order.totalAmount}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // Calculate details
    const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const tax = Number(order.taxAmount) || 0;
    const discount = Number(order.discountAmount) || 0;
    const total = Number(order.totalAmount);

    // Extract payment method(s)
    const paymentMethod = order.payments && order.payments.length > 0
      ? order.payments.map(p => p.method).join(', ')
      : 'CASH'; // fallback for cash if payments relation was not included

    const tableName = order.table ? order.table.name : 'Takeaway';
    const dateTimeStr = new Date(order.updatedAt || order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const mailOptions = {
      from: emailUser,
      to: order.customerEmail,
      subject: `Receipt for Order ${order.orderNumber} - ${cafeName}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #fcfcf9; padding: 24px; border: 1px solid #e2e8f0; border-radius: 24px;">
          <!-- Header -->
          <div style="background-color: #1A4D2E; color: #feffe8; padding: 32px 24px; text-align: center; border-radius: 18px 18px 0 0; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">${cafeName}</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;">Transaction Receipt</p>
          </div>

          <!-- Summary Info -->
          <div style="padding: 0 12px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; border-bottom: 1px dashed #cbd5e1; padding-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; font-weight: 500; padding: 4px 0;">Order Number:</td>
                <td style="text-align: right; font-weight: 700; color: #1A4D2E;">${order.orderNumber}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 500; padding: 4px 0;">Customer Name:</td>
                <td style="text-align: right; font-weight: 700;">${order.customerName || 'Guest'}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 500; padding: 4px 0;">Table / Service:</td>
                <td style="text-align: right; font-weight: 700;">${tableName}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 500; padding: 4px 0;">Payment Method:</td>
                <td style="text-align: right; font-weight: 700; text-transform: uppercase; color: #1A4D2E;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 500; padding: 4px 0;">Date & Time:</td>
                <td style="text-align: right; font-weight: 700;">${dateTimeStr}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 24px; padding: 0 12px;">
            <h3 style="font-size: 14px; font-weight: 800; color: #1A4D2E; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em;">Ordered Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 800; text-align: left;">
                  <th style="padding: 10px 0;">Item</th>
                  <th style="padding: 10px 0; text-align: center;">Qty</th>
                  <th style="padding: 10px 0; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px;">
                    <td style="padding: 14px 0;">
                      <div style="font-weight: 700; color: #1e293b;">${item.productName}</div>
                      ${item.variantName ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">+ Option: ${item.variantName}</div>` : ''}
                      ${item.notes ? `<div style="font-size: 11px; color: #d97706; font-style: italic; margin-top: 2px;">⚠️ Prep: ${item.notes}</div>` : ''}
                    </td>
                    <td style="padding: 14px 0; text-align: center; font-weight: 700; color: #1A4D2E;">${item.quantity}</td>
                    <td style="padding: 14px 0; text-align: right; font-weight: 700;">₹${(Number(item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Totals Breakdown -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; font-size: 14px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Subtotal</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 700;">₹${subtotal.toFixed(2)}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #ef4444; font-weight: 500;">Discount ${order.discountCode ? `(${order.discountCode})` : ''}</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #ef4444;">-₹${discount.toFixed(2)}</td>
              </tr>` : ''}
              ${tax > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Tax</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 700;">₹${tax.toFixed(2)}</td>
              </tr>` : ''}
              <tr style="border-top: 1px solid #cbd5e1;">
                <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: 800; color: #1A4D2E;">Total Amount</td>
                <td style="padding: 10px 0 0 0; text-align: right; font-size: 20px; font-weight: 900; color: #1A4D2E;">₹${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <!-- Footer Message -->
          <p style="text-align: center; color: #94a3b8; font-size: 12px; font-weight: 500; margin-top: 32px; text-transform: uppercase; letter-spacing: 0.1em;">
            ${footerMsg || `Thank you for dining with ${cafeName}!`}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Successfully sent bill to ${order.customerEmail}`);
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
  }
};
