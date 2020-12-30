const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Apagando servidor...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

//DATABASE CONFIGURATIONS
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  //.connect(process.env.DATABASE_LOCAL, {   //para usar una base de datos local
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Base de datos conectada'));

//ERROR HANDLING CONFIGURATIONS

//ENVOIREMENT CONFIGURATIONS

//console.log(process.env);

//OTHER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Àpp funcionando en el puerto ${port}....`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION!!!!!  💥 apagando servidor....');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
