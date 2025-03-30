export default function handler(req, res) {
    res.status(200).json({
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        TWILIO_PHONE: process.env.TWILIO_PHONE
    });
}
