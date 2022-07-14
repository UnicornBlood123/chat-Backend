import nodeMailer from "nodemailer";

const sendActivationMail = (to, link) => {
  return nodeMailer
    .createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    .sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Активация аккаунта chat-react",
      text: "",
      html: `
      <div>
      <h1>Для активации перейдите по ссылке</h1>
      <a href="http://localhost:3000/registration/verify?hash=${link}">http://localhost:3000/registration/verify?hash=${link}</a>
</div>
      `,
    });
};

export default sendActivationMail;
