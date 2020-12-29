const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El tour ha de tener un nombre'],
      unique: true,
      trim: true, //Elimina todos los espacios al principio y al final de un String
      maxlength: [40, 'El nombre del tour deverá de tener =< de 40 caracteres'],
      minlength: [10, 'El nombre del tour deverá de tener >= de 10 caracteres'],
      //validate: [validator.isAlpha,'El nombre del tour sólo debe contener letras']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'El tour ha de tener una duración'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'El tour ha de tener un groupSize'],
    },
    difficulty: {
      type: String,
      required: [true, 'El tour ha de tener una dificultad'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'La dificultad tiene que ser easy, medium o difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating deberá ser como mínimo 1.0'],
      max: [5, 'Rating deberá ser como máximo 5.0'],
      set: (val) => Math.round(val * 10) / 10, //esto hace 4.6666666, 46.6666666 =>47, 4.7
    },
    ratingsQuantatity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Ha de especificar un precio'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this sólo apunta al documento actual en NUEVOS documentos a CREAR
          return val < this.price;
        },
        message: 'El descuento ({VALUE}) deberá ser menor que el precio normal',
      },
    },
    summary: {
      type: String,
      required: [true, 'Ha de tener una descripción corta'],
      trim: true, //Elimina todos los espacios al principio y al final de un String
    },
    description: {
      type: String,
      trim: true, //Elimina todos los espacios al principio y al final de un String
    },
    imageCover: {
      type: String,
      required: [true, 'Ha de tener una foto de portada'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //esto es para que nunca se muestre al exterior
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // si embebemos documentos solo necesitamos especificar una array simple
    //guides: Array,
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    //para mostrar campos calculados no guardados en la base de datos
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//crear indexes
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: sólo funciona antes de .save() and.create()

/*tourSchema.pre('save', function (next) {
  console.log('Un archivo será guardado....');
  next();
});

tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});*/

tourSchema.pre('save', function (next) {
  //console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

/* codigo para embeber un array dentro de un bjeto
tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
});
*/

// QUERY MIDDLEWARE:
//  tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`La consulta ha tardado ${Date.now() - this.start} milisegundos`);
  //console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE
/*
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});
*/
// Solución propuesta en los comentarios del curso
tourSchema.pre('aggregate', function (next) {
  if (!Object.keys(this.pipeline()[0])[0] === '$geoNear')
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
