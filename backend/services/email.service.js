import nodemailer from "nodemailer";




export const sendOTP = async (email, otp) => {

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"CampuSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Verification",
    html: `<h2>Your OTP is: ${otp}</h2>`,
  });
};

// GENERIC EMAIL (Notifications, Alerts etc.)
export const sendEmail = async (to, subject, message) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"CampuSync" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <h3>${subject}</h3>
      <p>${message}</p>
      <br/>
      <p>Regards,<br/>CampuSync Team</p>
    `,
  });

};