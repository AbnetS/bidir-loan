// LoanSection Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var LoanSectionSchema = new Schema({       
    title:           { type: String, default: '' },
    number:          { type: Number, default: 1 },
    answers:       [{ type: Schema.Types.ObjectId, ref: 'Answer' }],
    date_created:    { type: Date },
    last_modified:   { type: Date }
});

// add mongoose-troop middleware to support pagination
LoanSectionSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
LoanSectionSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter LoanSection Attributes to expose
 */
LoanSectionSchema.statics.attributes = {
  title: 1,
  number: 1,
  answers: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose LoanSection model
module.exports = mongoose.model('LoanSection', LoanSectionSchema);