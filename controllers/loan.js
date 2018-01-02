'use strict';
/**
 * Load Module Dependencies.
 */
const crypto  = require('crypto');
const path    = require('path');
const url     = require('url');

const debug      = require('debug')('api:loan-controller');
const moment     = require('moment');
const jsonStream = require('streaming-json-stringify');
const _          = require('lodash');
const co         = require('co');
const del        = require('del');
const validator  = require('validator');

const config             = require('../config');
const CustomError        = require('../lib/custom-error');
const checkPermissions   = require('../lib/permissions');

const TokenDal           = require('../dal/token');
const LoanDal            = require('../dal/loan');
const AnswerDal          = require('../dal/answer');
const LogDal             = require('../dal/log');
const NotificationDal    = require('../dal/notification');
const ClientDal          = require('../dal/client');
const TaskDal            = require('../dal/task');
const FormDal            = require('../dal/form');
const AccountDal         = require('../dal/account');
const ScreeningDal       = require('../dal/screening');

let hasPermission = checkPermissions.isPermitted('LOAN');

/**
 * Create a loan.
 *
 * @desc create a loan using basic Authentication or Social Media
 *
 * @param {Function} next Middleware dispatcher
 *
 */
exports.create = function* createLoan(next) {
  debug('create loan');

  let body = this.request.body;

  this.checkBody('client')
      .notEmpty('Loan Client is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'LOAN_CREATION_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {

    let loanForm = yield FormDal.get({ type: 'Loan Application' });
    if(!loanForm || !loanForm._id) {
      throw new Error('Loan Form Is Needed To Be Created In Order To Continue!')
    }

    let client = yield ClientDal.get({ _id: body.client });
    if(!client) {
      throw new Error('Client Does Not Exist!!');
    }

    let screening = yield ScreeningDal.get({ client: client._id });
    if(screening.status != 'approved') {
      throw new Error('Screening Application Has Not Been Approved Yet');
    }

    let loan = yield LoanDal.get({ client: client._id });
    if(loan) {
      throw new Error('Client Has A Loan Application Form Already!!');
    }

    // Create New Screening
    let answers = [];
    let loanBody = {};
    loanForm = loanForm.toJSON();

    // Create Answer Types
    for(let question of loanForm.questions) {
      let subs = [];
      delete question._id;

      if(question.sub_questions.length) {
        for(let sub of question.sub_questions) {
          delete sub._id;
          let ans = yield AnswerDal.create(sub);

          subs.push(ans);
        }
      }

      question.sub_questions = subs;

      let answer = yield AnswerDal.create(question);

      answers.push(answer);
    }

    let account = yield AccountDal.get({ user: this.state._user._id });
    if(!account) {
      account = this.state._user;
    }

    loanBody.answers = answers;
    loanBody.client = client._id;
    loanBody.title = 'Loan Form';
    loanBody.description = `Loan Process For ${client.first_name} ${client.last_name}`;
    loanBody.created_by = account._id;

    // Create Loan Type
    loan = yield LoanDal.create(loanBody);

    yield ClientDal.update({ _id: client._id }, { status: 'loan_application_new'});

    this.body = loan;


  } catch(ex) {
    this.throw(new CustomError({
      type: 'LOAN_CREATION_ERROR',
      message: ex.message
    }));
  }

};


/**
 * Get a single loan.
 *
 * @desc Fetch a loan with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneLoan(next) {
  debug(`fetch loan: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'LOAN_STATUS_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };

  try {
    let loan = yield LoanDal.get(query);

    yield LogDal.track({
      event: 'view_loan',
      loan: this.state._user._id ,
      message: `View loan - ${loan.title}`
    });

    this.body = loan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'LOAN_RETRIEVAL_ERROR',
      message: ex.message
    }));
  }

};

/**
 * Update Loan Status
 *
 * @desc Fetch a loan with the given ID and update their respective status.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.updateStatus = function* updateLoan(next) {
  debug(`updating status loan: ${this.params.id}`);

  return this.body = { message: 'Use PUT /loans/:id' };

  let isPermitted = yield hasPermission(this.state._user, 'AUTHORIZE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'LOAN_STATUS_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  this.checkBody('status')
      .notEmpty('Status should not be empty')
      .isIn(['inprogress','accepted', 'submitted','declined_final', 'declined_under_review'], 'Correct Status is either inprogress, declined_final, approved, submitted or declined_under_review');

  let query = {
    _id: this.params.id
  };

  let body = this.request.body;

  try {

    let loan = yield LoanDal.get(query);

    if(loan.status === 'new') {
      let client = yield ClientDal.update({ _id: loan.client }, { status: 'inprogress' });
    }

    if(loan.status == body.status) {
      throw new Error(`Loan Is Already ${body.status}`);
    }

    loan = yield LoanDal.update(query, body);

    /*if(body.status === 'declined') {
      let client = yield ClientDal.get({ _id: loan.client });

      yield NotificationDal.create({
        for: loan.created_by,
        message: `Loan for ${client.first_name} ${client.last_name} has been declined.`
      });
    }*/

    yield LogDal.track({
      event: 'loan_status_update',
      loan: this.state._user._id ,
      message: `Update Status for ${loan.title}`,
      diff: body
    });

    this.body = loan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'LOAN_STATUS_UPDATE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Update a single loan.
 *
 * @desc Fetch a loan with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.update = function* updateLoan(next) {
  debug(`updating loan: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'LOAN_STATUS_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let canApprove = yield hasPermission(this.state._user, 'AUTHORIZE');

  this.checkBody('status')
      .notEmpty('Status should not be empty')
      .isIn(['inprogress','submitted', 'accepted','declined_final', 'declined_under_review'], 'Correct Status is either inprogress, accepted, submitted, declined_final or declined_under_review');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'LOAN_UPDATE_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  let query = {
    _id: this.params.id
  };

  let body = this.request.body;

  try {
    if(body.status === 'accepted' || body.status === 'declined_final' || body.status === 'declined_under_review' ) {
      if(!canApprove) {
        throw new Error("You Don't have enough permissions to complete this action");
      }
    }
    let loan = yield LoanDal.get(query);
    let client    = yield ClientDal.get({ _id: loan.client });

    if(loan.status === 'new') {
      client = yield ClientDal.update({ _id: client._id }, { status: 'loan_application_inprogress' });
    }

    if(body.status === 'accepted') {
      client = yield ClientDal.update({ _id: loan.client }, { status: 'loan_application_accepted' });
      let task = yield TaskDal.update({ entity_ref: loan._id }, { status: 'completed' });
      yield NotificationDal.create({
        for: task.created_by,
        message: `Loan Application of ${client.first_name} ${client.last_name} has been accepted`,
        task_ref: task._id
      });

    } else if(body.status === 'declined_final') {
      client = yield ClientDal.update({ _id: loan.client }, { status: 'loan_application_declined' });
      let task = yield TaskDal.update({ entity_ref: loan._id }, { status: 'completed' });
      yield NotificationDal.create({
        for: task.created_by,
        message: `Loan Application of ${client.first_name} ${client.last_name} has been declined in Final`,
        task_ref: task._id
      });

    } else if(body.status === 'declined_under_review') {
      client = yield ClientDal.update({ _id: loan.client }, { status: 'loan_application_inprogress' });
      let task = yield TaskDal.update({ entity_ref: loan._id }, { status: 'completed' });
      // Create Review Task
      let _task = yield TaskDal.create({
        task: `Review Loan Application of ${client.first_name} ${client.last_name}`,
        task_type: 'review',
        entity_ref: loan._id,
        entity_type: 'loan',
        created_by: this.state._user._id,
        user: task.created_by
      });
      yield NotificationDal.create({
        for: this.state._user._id,
        message: `Loan Application of ${client.first_name} ${client.last_name} has been declined For Further Review`,
        task_ref: _task._id
      });

    }
    
    let mandatory = false;

    if(body.answers) {
      let answers = [];

      for(let answer of body.answers) {
        let answerID = answer._id;

        delete answer._id;
        delete answer._v;
        delete answer.date_created;
        delete answer.last_modified;

        let result = yield AnswerDal.update({ _id: answerID }, answer);

        answers.push(result);
      }

      body.answers = answers;
    }

    loan = yield LoanDal.update(query, body);

    if(body.status && body.status === 'submitted') {
      // Create Task
      yield TaskDal.create({
        task: `Approve Loan For of ${client.first_name} ${client.last_name}`,
        task_type: 'approve',
        entity_ref: loan._id,
        entity_type: 'loan',
        created_by: this.state._user._id
      })
    }

    yield LogDal.track({
      event: 'loan_update',
      loan: this.state._user._id ,
      message: `Update Info for ${loan.title}`,
      diff: body
    });

    this.body = loan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'UPDATE_LOAN_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of loans by Pagination
 *
 * @desc Fetch a collection of loans
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchAllByPagination = function* fetchAllLoans(next) {
  debug('get a collection of loans by pagination');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {};

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  try {
    let loans = yield LoanDal.getCollectionByPagination(query, opts);

    this.body = loans;
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'FETCH_PAGINATED_LOANS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};


/**
 * Remove a single loan.
 *
 * @desc Fetch a loan with the given id from the database
 *       and Remove their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.remove = function* removeLoan(next) {
  debug(`removing loan: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try {
    let loan = yield LoanDal.delete(query);
    if(!loan._id) {
      throw new Error('Loan Does Not Exist!');
    }

    for(let answer of loan.answers) {
      answer = yield AnswerDal.delete({ _id: answer._id });
      if(answer.sub_answers.length) {
        for(let _answer of answer.sub_answers) {
          yield AnswerDal.delete({ _id: _answer._id });
        }
      }
    }

    yield LogDal.track({
      event: 'loan_delete',
      permission: this.state._user._id ,
      message: `Delete Info for ${loan._id}`
    });

    this.body = loan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'REMOVE_LOAN_ERROR',
      message: ex.message
    }));

  }

};