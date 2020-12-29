const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../../models/tourModel');
const User = require('../../../models/userModel');
const Review = require('../../../models/reviewModel');

dotenv.config({ path: './config.env' });

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

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Datos cargados correctamente');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

//DELETE ALL DATA FROM COLLECTIN
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Datos borrados correctamente');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === '--importar') {
  importData();
} else if (process.argv[2] === '--borrar') {
  deleteData();
}
console.log(process.argv);
