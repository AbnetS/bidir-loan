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
const FORM                = require ('../lib/enums').FORM;

const Account            = require('../models/account');
const Question           = require('../models/question');
const Form               = require('../models/form');
const Section            = require('../models/section');
const Screening          = require('../models/screening');
const Loan               = require('../models/loan');
const History            = require('../models/history');
const ClientACAT         = require('../models/clientACAT');

const TokenDal           = require('../dal/token');
const LoanDal            = require('../dal/loan');
const LogDal             = require('../dal/log');
const NotificationDal    = require('../dal/notification');
const ClientDal          = require('../dal/client');
const TaskDal            = require('../dal/task');
const FormDal            = require('../dal/form');
const AccountDal         = require('../dal/account');
const ScreeningDal       = require('../dal/screening');
const SectionDal         = require('../dal/section');
const QuestionDal        = require('../dal/question');

let hasPermission = checkPermissions.isPermitted('LOAN');

let PREQS = [];

/**
 * Create a loan.
 *
 * @desc create a loan using basic Authentication or Social Media
 *
 * @param {Function} next Middleware dispatcher
 *
 */

exports.create = function* createLoan(next) {
  console.log('create loan');
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


    let loanForm = yield FormDal.get({ type: 'LOAN_APPLICATION' });
    if(!loanForm || !loanForm._id) {
      throw new Error('Loan Form Is Needed To Be Created In Order To Continue!')
    }

    let client = yield ClientDal.get({ _id: body.client });
    if(!client) {
      throw new Error('Client Does Not Exist!!');
    }

    let loan = yield validateCycle(body);
    let history = null;

    if (!body.for_group){
      let history = yield History.findOne({client: client._id}).exec()
      if (!history) {
        throw new Error('Client Has No Loan History');

      } else {
        history = history.toJSON();

        let cycleOk = true;
        let loanPresent = true;
        let whichCycle = history.cycle_number;
        let missingApplications = [];

        for(let cycle of history.cycles) {
          if (cycle.cycle_number === history.cycle_number) {
            if (!cycle.screening) {
              !cycle.screening ? missingApplications.push('Screening') : null;
              cycleOk = false;
              break;
            } else if (cycle.loan) {
              loanPresent = false;
              break;
            }
          }
        }

        if (!cycleOk) {
          throw new Error(`Loan Cycle (${whichCycle}) is in progress. Missing ${missingApplications.join(', ')} Application(s)`);
        }

        if (!loanPresent) {
          throw new Error(`Loan Cycle (${whichCycle}) is in progress. Move To ACAT Application(s)`);
        }
      }
  }


    // Create New Loan
    let questions = [];
    let sections = [];
    let loanBody = {};
    loanForm = loanForm.toJSON();

    // Create Answer Types
   PREQS = [];
    for(let question of loanForm.questions) {
      question = yield createQuestion(question);

      if(question) {
        questions.push(question._id);
      }
    }

    yield createPrerequisites();

    // Create Section Types
    PREQS = [];
    for(let section of loanForm.sections) {
      section = yield Section.findOne({ _id: section }).exec();
      if(!section) continue;
      section = section.toJSON();

      let _questions = [];
      delete section._id;
      if(section.questions.length) {

        for(let question of section.questions) {
          PREQS = [];
          question = yield createQuestion(question);
          if(question) {

            _questions.push(question._id);
          }

          
        }

      }

      section.questions = _questions;

      let _section = yield SectionDal.create(section);

      sections.push(_section._id);
    }

    yield createPrerequisites();

    loanBody.questions = questions.slice();
    loanBody.sections = sections.slice();
    loanBody.client = client._id;
    loanBody.title = 'Loan Form';
    loanBody.subtitle = loanForm.subtitle;
    loanBody.purpose = `Loan Application For ${client.first_name} ${client.last_name}`;
    loanBody.layout = loanForm.layout;
    loanBody.has_sections = loanForm.has_sections;
    loanBody.disclaimer = loanForm.disclaimer;
    loanBody.signatures = loanForm.signatures.slice();
    loanBody.created_by = client.created_by;
    loanBody.branch = client.branch._id;

    // Create Loan Type
    loan = yield LoanDal.create(loanBody);

    yield ClientDal.update({ _id: client._id }, { status: 'loan_application_new'});

    if (history) {
      let cycles = history.cycles.slice();

      for(let cycle of cycles) {
        if (cycle.cycle_number === history.cycle_number) {
          cycle.loan = loan._id;
          cycle.last_edit_by = this.state._user._id;
          cycle.last_modified = moment().toISOString();
        }
      }

      yield History.findOneAndUpdate({
        _id: history._id
      },{
        $set: {
          cycles: cycles,
          last_modified:  moment().toISOString()
        }
      }).exec()
    }

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
      .isIn(['inprogress','submitted', 'accepted','rejected', 'declined_under_review', 'loan_paid'], 'Correct Status is either inprogress, accepted, submitted, rejected, loan_paid or declined_under_review');

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
    if(body.status === 'loan_paid' || body.status === 'accepted' || body.status === 'rejected' || body.status === 'declined_under_review' ) {
      if(!canApprove) {
        throw new Error("You Don't have enough permissions to complete this action");
      }
    }
    let loan = yield LoanDal.get(query);
    let client    = yield ClientDal.get({ _id: loan.client });
    let comment = body.comment ? body.comment : '';

    if(body.status === 'accepted') {
      client = yield ClientDal.update({ _id: loan.client }, { status: 'loan_application_accepted' });
      let task = yield TaskDal.update({ entity_ref: loan._id }, { status: 'completed', comment: comment });
      if(task) {
        yield NotificationDal.create({
          for: task.created_by,
          message: `Loan Application of ${client.first_name} ${client.last_name} has been accepted`,
          task_ref: task._id
        });
      }

    } else if(body.status === 'loan_paid') {
      client = yield ClientDal.update({ _id: loan.client }, { status: 'loan_paid' });
      let task = yield TaskDal.update({ entity_ref: loan._id }, { status: 'completed', comment: comment });
      if(task) {
        yield NotificationDal.create({
          for: task.created_by,
          message: `Loan of ${client.first_name} ${client.last_name} has been Paid`,
          task_ref: task._id
        });
      }
      
    } else if(body.status === 'rejected') {
      client = yield ClientDal.update({ _id: loan.client }, { status: 'loan_application_rejected' });
      let task = yield TaskDal.update({ entity_ref: loan._id }, { status: 'completed', comment: comment });
      if(task) {
        yield NotificationDal.create({
          for: task.created_by,
          message: `Loan Application of ${client.first_name} ${client.last_name} has been Rejected in Final`,
          task_ref: task._id
        });
      }

    } else if(body.status === 'declined_under_review') {
      client = yield ClientDal.update({ _id: loan.client }, { status: 'loan_application_inprogress' });
      let task = yield TaskDal.update({ entity_ref: loan._id }, { status: 'completed', comment: comment });
      if(task) {
        // Create Review Task
        let _task = yield TaskDal.create({
          task: `Review Loan Application of ${client.first_name} ${client.last_name}`,
          task_type: 'review',
          entity_ref: loan._id,
          entity_type: 'loan',
          created_by: this.state._user._id,
          user: task.created_by,
          branch: loan.branch,
          comment: comment
        });
        yield NotificationDal.create({
          for: this.state._user._id,
          message: `Loan Application of ${client.first_name} ${client.last_name} has been declined For Further Review`,
          task_ref: _task._id
        });
      }
    } else if(body.status === 'submitted') {
      client = yield ClientDal.update({ _id: client._id }, { status: 'loan_application_inprogress' });
    }
    
    let mandatory = false;

    if (body.sections) {
      for(let section of body.sections) {
        if(section._id) {
          for(let question of section.questions) {
            yield updateQuestions(question);
          }
        }
      }
      delete body.sections;
    }

    if (body.questions) {
      for(let question of body.questions) {
        if(question._id) {
          yield updateQuestions(question);
        }
      }
      delete body.questions;

    }
    
    function updateQuestions(question) {
      return co(function* () {
        let subQuestions = question.sub_questions.slice();
        let ref = question._id;

        delete question.sub_questions;
        delete question._v;
        delete question.date_created;
        delete question.last_modified;

        yield QuestionDal.update({ _id: ref }, question);

        for(let subQuestion of subQuestions) {
            yield updateQuestions(subQuestion);
        }
      })
    }

    loan = yield LoanDal.update(query, body);

    if(body.status && body.status === 'submitted') {
      // Create Task
      yield TaskDal.create({
        task: `Approve Loan For ${client.first_name} ${client.last_name}`,
        task_type: 'approve',
        entity_ref: loan._id,
        entity_type: 'loan',
        created_by: this.state._user._id,
        branch: loan.branch,
        comment: comment
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

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {};

  /*if(!this.query.source || (this.query.source != 'web' && this.query.source != 'app')) {
    return this.throw(new CustomError({
      type: 'VIEW_LOANS_COLLECTION_ERROR',
      message: 'Query Source should be either web or app'
    }));
  }

  if(this.query.source == 'web' && !isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_LOANS_COLLECTION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }*/

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

   let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');

  try {
    let user = this.state._user;
    let account = yield Account.findOne({ user: user._id }).exec();

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
        query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // Can VIEW
    } else if(canView) {
        query = {
          created_by: user._id
        };

    // DEFAULT
    } else {
      query = {
          created_by: user._id
        };
    }

    if(this.query.show_active) {
      query.status = {
        $in: ['inprogress','submitted', 'new', 'declined_under_review']
      }
    }

    let loans = yield LoanDal.getCollectionByPagination(query, opts);

    this.body = loans;
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_LOANS_COLLECTION_ERROR',
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

/**
 * Search Loans
 *
 * @desc Search a collection of loans
 *
 * @param {Function} next Middleware dispatcher
 */
exports.search = function* searchLoans(next) {
  debug('get a collection of loans by pagination');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');

  try {

    let user = this.state._user;
    let account = yield Account.findOne({ user: user._id }).exec();
    let query = {};

    let searchTerm = this.query.search;
    if(!searchTerm) {
      throw new Error('Please Provide A Search Term');
    }

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
        query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // Can VIEW
    } else if(canView) {
        query = {
          created_by: user._id
        };

    // DEFAULT
    } else {
      query = {
          created_by: user._id
        };
    }

    query.$or = [];

    let terms = searchTerm.split(/\s+/);
    let groupTerms = { $in: [] };

    for(let term of terms) {
      if(validator.isMongoId(term)) {
        throw new Error('IDs are not supported for Search');
      }

      term = new RegExp(`${term}`, 'i')

      groupTerms.$in.push(term);
    }

    query.$or.push({
        title: groupTerms
      },{
        description: groupTerms
      },{
        status: groupTerms
    });
   
    let loans = yield LoanDal.getCollectionByPagination(query, opts);

    this.body = loans;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'SEARCH_LOANS_ERROR',
      message: ex.message
    }));
  }
};


/**
 * Get a client loan.
 *
 * @desc Fetch a loan with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.getClientLoan = function* getClientLoan(next) {
  debug(`fetch client loan: ${this.params.id}`);

  /*let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'CLIENT_LOAN_VIEW_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }*/

  let query = {
    client: this.params.id
  };

  try {
    let loan = yield LoanDal.get(query, "last");
    if(!loan) throw new Error('Client Has No Loan Application!');

    yield LogDal.track({
      event: 'view_client_loan',
      user: this.state._user._id ,
      message: `View Client Loan - ${loan.title}`
    });

    this.body = loan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'CLIENT_LOAN_VIEW_ERROR',
      message: ex.message
    }));
  }

};

// Utilities
function createQuestion(question) {
  return co(function* () {
    if(question) {
      question = yield Question.findOne({ _id: question }).exec();
      if(!question) return;

      question = question.toJSON();
    }


    let subs = [];
    delete question._id;

    if(question.sub_questions.length) {
      for(let sub of question.sub_questions) {
        delete sub._id;
        let ans = yield createQuestion(sub);

        if(ans) {
          subs.push(ans._id);
        }
      }

      question.sub_questions = subs;
    }

    let prerequisites = question.prerequisites.slice();

    question.prerequisites = [];

    question = yield QuestionDal.create(question);

    PREQS.push({
      _id: question._id,
      question_text: question.question_text,
      prerequisites: prerequisites
    });



    return question;

  })
}


function createPrerequisites() {
  return co(function*() {
    if(PREQS.length) {
      for(let question of PREQS) {
        let preqs = [];
        for(let  prerequisite of question.prerequisites) {
          let preq = yield Question.findOne({ _id: prerequisite.question }).exec();

          let ques = yield findQuestion(preq.question_text);
          if(ques) {
            preqs.push({
              answer: prerequisite.answer,
              question: ques._id
            })
          }
        }

        yield QuestionDal.update({ _id: question._id }, {
          prerequisites: preqs
        })
      }
    } 
  })
}

function findQuestion(text) {
  return co(function* () {
    let found = null;

    if(PREQS.length) {
      for(let question of PREQS) {

        question = yield Question.findOne({ _id: question._id }).exec();

        if(question.question_text == text) {
          found = question;
          break;
        }
      }
    }

    return found;
  })
}

function validateCycle(body) {
  return co(function*(){
    debug("Validating loan cycle")
    // Validate Screenings
    let screenings = yield Screening.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();
    if(!screenings.length) {
      throw new Error('Client Has Not Screening Form Yet!');
    }

    for(let screening of screenings) {
      if(screening.status === "new" || screening.status === "screening_inprogress" || screening.status === "submitted") {
        throw new Error('Client Has A Screening in progress!!')
      }
    }

    // Validate Loans
    let loans = yield Loan.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    for(let loan of loans) {
      if(loan.status === 'new' || loan.status === 'submitted' || loan.status === "inprogress") {
        throw new Error('Client Has A Loan in progress!!')
      }
    }

    // Validate acats
    let clientACATS = yield ClientACAT.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    for(let acat of clientACATS) {
      if(acat.status === 'new' || acat.status === 'submitted' || acat.status === 'resubmitted' || acat.status === "inprogress") {
        throw new Error('Client Has An ACAT in progress!!')
      }
    }

    let loan = yield Loan.findOne({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    return loan;
    
  })
}