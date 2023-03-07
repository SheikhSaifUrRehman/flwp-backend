const sgMail = require('@sendgrid/mail');
const config = require('config');

console.log(`config.get('mailKey')`, config.get('mailKey'));
sgMail.setApiKey(config.get('mailKey'));

const varificationKey = Math.floor(1000 + Math.random() * 9000);

const message = {
  from: 'u.ahmadnode@gmail.com',
  to: 'alirazamunir402@gmail.com',
  subject: 'EMAIL TESTING',
  text: 'this is testing of email for Smurf App',
  html: `<strong>your varification code  is ${varificationKey}</strong>`,
};

sgMail
  .send(message)
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
