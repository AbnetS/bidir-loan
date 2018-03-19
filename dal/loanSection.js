'use strict';
// Access Layer for LoanSection Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-section');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const LoanSection    = require('../models/loanSection');
const Answer    = require('../models/answer');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = LoanSection.attributes;
var population = [{
  path: 'answers',
  select: Answer.attributes,
  options: {
    sort: { number: '1' }
  }
}];

/**
 * create a new section.
 *
 * @desc  creates a new section and saves them
 *        in the database
 *
 * @param {Object}  sectionData  Data for the section to create
 *
 * @return {Promise}
 */
exports.create = function create(sectionData) {
  debug('creating a new section');

  return co(function* () {

    let unsavedLoanSection = new LoanSection(sectionData);
    let newLoanSection = yield unsavedLoanSection.save();
    let section = yield exports.get({ _id: newLoanSection._id });

    return section;


  });

};

/**
 * delete a section
 *
 * @desc  delete data of the section with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteLoanSection(query) {
  debug('deleting section: ', query);

  return co(function* () {
    let section = yield exports.get(query);
    let _empty = {};

    if(!section) {
      return _empty;
    } else {
      yield section.remove();

      return section;
    }

  });
};

/**
 * update a section
 *
 * @desc  update data of the section with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating section: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return LoanSection.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a section.
 *
 * @desc get a section with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, section) {
  debug('getting section ', query);

  return LoanSection.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of sections
 *
 * @desc get a collection of sections from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of sections');

  return new Promise((resolve, reject) => {
    resolve(
     LoanSection
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of sections using pagination
 *
 * @desc get a collection of sections from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of sections');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    LoanSection.paginate(query, opts, function (err, docs) {
      if(err) {
        return reject(err);
      }

      let data = {
        total_pages: docs.pages,
        total_docs_count: docs.total,
        current_page: docs.page,
        docs: docs.docs
      };

      return resolve(data);

    });
  });


};
