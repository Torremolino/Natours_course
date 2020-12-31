const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    // SCHEMA DEFINITIONS
    review: {
      type: String,
      required: [true, 'El comentario no puede estar vacío'],
    },
    rating: {
      type: Number,
      default: 2.5,
      min: [1, 'Rating deberá ser como mínimo 1.0'],
      max: [5, 'Rating deberá ser como máximo 5.0'],
    },
    createdAt: { type: Date, default: Date.now },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'El comentario debe hacer referencia a algún tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, ' El comentario debe contener un usuario'],
    },
  },
  {
    // SCHEMA OPTIONS
    //  virtuals, no serán guardados en la base de datos pero serán mostrados xq virtuals:true
    //  Los virtuals se utilizan para campos que pueden derivar unos de otros, campos calculados no guardados en la base de datos
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Para evitar que un usuario cree varias reseñas para el mismo tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

/*reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name',
  });
  next();
});*/

reviewSchema.pre(/^find/, function (next) {
  /*this.populate({
    path: 'tour',
    select: '-guides name',
  }).populate({
    path: 'user',
    select: '-_id name',
  });*/

  // 'this' apunta a la consulta
  this.populate({
    path: 'user',
    select: '-_id name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // 'this' apunta al modelo
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantatity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantatity: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // middleware
  // this apunta al documento actual
  // 'constructor' es el modelo que crea este documento
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // 'this' apunta a la consulta actual
  // 'this.findOne ()' obtiene el documento 'antiguo' de la base de datos, pero solo nos interesa id del tour, así que eso no importa aquí.
  // 'this.r' crea una nueva propiedad, r = al documento 'antiguo', en la consulta actual.
  // Los datos con el ID del tour se pasan a través de la variable 'this', del pre-middleware al post-middleware.

  this.r = await this.findOne();
  //console.log(r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does not work here, the query has already executed
  // 'await this.findOne()' NO funciona aquí, porque la consulta ya se ha ejecutado, en su lugar, recuperamos el Id del tour de la review 'antigua' de la variable 'this.r.tour'. En este momento, la revisión se ha actualizado y podemos llamar a calcAverageRatings() con 'this.r.tour' como argumento.
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
