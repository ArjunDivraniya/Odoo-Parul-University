const nodemailer = require('nodemailer');

exports.sendBill = async (order) => {
    if (!order.customerEmail) return;

    try {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

        if (!emailUser || !emailPass) {
            console.log(`[Email Service Mock] Credential missing. Would send to: ${order.customerEmail}`);
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        // Calculate totals
        const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const tax = subtotal * 0.09; 
        const total = Number(order.totalAmount);

        const mailOptions = {
            from: emailUser,
            to: order.customerEmail,
            subject: `Receipt for Order ${order.orderNumber} - Odoo Cafe`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background-color: #1A4D2E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1>Odoo Cafe</h1>
                        <p>Order Receipt</p>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <p>Hi ${order.customerName || 'Customer'},</p>
                        <p>Thank you for dining with us! Here is your receipt for order <strong>${order.orderNumber}</strong>.</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <thead>
                                <tr style="background-color: #f8f9fa;">
                                    <th style="padding: 10px; text-align: left;">Item</th>
                                    <th style="padding: 10px; text-align: center;">Qty</th>
                                    <th style="padding: 10px; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
                                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₹${(Number(item.price) * item.quantity).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal</td>
                                    <td style="padding: 10px; text-align: right;">₹${subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Tax (9%)</td>
                                    <td style="padding: 10px; text-align: right;">₹${tax.toFixed(2)}</td>
                                </tr>
                                <tr style="background-color: #E8F5E9;">
                                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; color: #1A4D2E;">Total</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold; color: #1A4D2E;">₹${total.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <p style="text-align: center; color: #777; font-size: 12px; margin-top: 30px;">
                            ${new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Successfully sent bill to ${order.customerEmail}`);
    } catch (error) {
        console.error("[Email Service] Error sending email:", error);
    }
};
