/* import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments }) => {
  // sender Info
  const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: process.env.SENDERMAIL,
      pass: process.env.SENDERPASS,
    },
  });
  // reciever Info
  const emailInfo = await transporter.sendMail({
    from: ` "DiamondSoul" <${process.env.SENDERMAIL}>`, // sender address
    to,
    subject,
    html,
    attachments,
  });

  return emailInfo.accepted.lenght < 1 ? false : true;
};
 */

import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    // sender Info
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Use Gmail's SMTP server
      port: 465,
      secure: true,
      auth: {
        user: process.env.SENDERMAIL,
        pass: process.env.SENDERPASS,
      },
    });

    // receiver Info
    const emailInfo = await transporter.sendMail({
      from: ` "DiamondSoul" <${process.env.SENDERMAIL}>`, // sender address
      to,
      subject,
      html,
      attachments,
    });

    return emailInfo.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
