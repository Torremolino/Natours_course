const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Ricardo Areán <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid;
      return nodemailer.createTransport({
        service: 'SendGrid', // No tenemos que especificar el host ni el puerto xq sendgrid los conoce cuando especificamos el servicio.
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Enviar el email
  async send(template, subject) {
    // 1) Render HTML basada en una plantilla pug
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Definir opciones del email
    const mailOptions = {
      from: this.from, // Si usamos sendgrid el email de este from ha de ser el mismo en ambas configuraciones
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) crear el traspor y enviar el email
    await this.newTransport().sendMail(mailOptions); // sendMail es el constructor de nodemailer
  }

  async sendWelcome() {
    await this.send('welcome', 'Bienvenido a la familia Natorus!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Tu token de reseteo de password (válido sólo 5 minutos)'
    );
  }
};

/* 
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Ricardo Areán <hello@ricardo.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
 */
