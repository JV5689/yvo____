import nodemailer from 'nodemailer';
const getTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) {
        throw new Error('SMTP credentials are not configured');
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass,
        },
    });
};
export const sendOtpEmail = async ({ to, otp }) => {
    const transporter = getTransporter();
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
        from,
        to,
        subject: 'Your login OTP',
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });
};
export const sendWelcomeEmail = async ({ to, name }) => {
    const transporter = getTransporter();
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const greeting = name ? `Hi ${name}` : 'Hi there';
    await transporter.sendMail({
        from,
        to,
        subject: 'Thanks for joining',
        text: `${greeting}, thanks for joining us!`,
    });
};
export const sendPlanRequestEmail = async ({ adminEmail, customer, plan }) => {
    const transporter = getTransporter();
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const details = [
        `Plan: ${plan.name}`,
        `Price: ${plan.price}`,
        `Customer Name: ${customer.name}`,
        `Customer Email: ${customer.email}`,
        customer.phone ? `Customer Phone: ${customer.phone}` : 'Customer Phone: N/A',
    ];
    await transporter.sendMail({
        from,
        to: adminEmail,
        subject: `New plan request - ${plan.name}`,
        text: `A new plan request was submitted.\n\n${details.join('\n')}`,
    });
};
