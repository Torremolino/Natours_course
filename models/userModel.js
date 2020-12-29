const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ha de indicar un nombre para el usuario'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Ha de indicar un email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Por favor indica un email válido'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },

  password: {
    type: String,
    required: [true, 'Por favor indique un password'],
    minlength: 8,
    select: false, // con esto no será mostrado nunca
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Por favor confirma tu password'],
    validate: {
      //this only work on CREATE and SAVE!!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'El Password no es el mismo',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre('save', async function (next) {
  // Esto sólo funciona si el password es modificado
  if (!this.isModified('password')) return next();

  // Encripta el password
  this.password = await bcrypt.hash(this.password, 12);

  // Borra el campo de passwordConfirm xq no lo necesitamos
  this.passwordConfirm = undefined; //No necesitamos guardarlo
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this poinst to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  //false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 5 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
