import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0

async function sendEmail({from, to, subject, text}) {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
        username: "api",
        key: process.env.MAILGUN_API_KEY,
    });
    try {
        const data = await mg.messages.create("sandbox4de5de3506584c60b3f61126510d80d3.mailgun.org", {
            from: "Mailgun Sandbox <postmaster@sandbox4de5de3506584c60b3f61126510d80d3.mailgun.org>",
            to: ["Shreeyam Kacker <shreeyamkacker@gmail.com>"],
            subject: "Hello Shreeyam Kacker",
            text: "Congratulations Shreeyam Kacker, you just sent an email with Mailgun! You are truly awesome!",
        });

        console.log(data); // logs response data
    } catch (error) {
        console.log(error); //logs any error
    }
}