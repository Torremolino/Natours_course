const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Apagando servidor...');
  console.log(err);
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

// ARRANCAR EL SERVIDOR
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

process.on('SIGTERM', () => {
  //esto es para apagar el servidor a la señal SIGTERM de heroku CADA 24H
  console.log('👋 SIGTERM RECIBIDO, apagando servidor adecuadamente 👋 👋 ');
  server.close(() => {
    console.log('💥 Proceso terminado!');
  });
});
