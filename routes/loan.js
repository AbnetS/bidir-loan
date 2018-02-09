'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:loan-router');

const loanController  = require('../controllers/loan');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();

/**
 * @api {post} /loans/create Create new Loan
 * @apiVersion 1.0.0
 * @apiName CreateLoan
 * @apiGroup Loan
 *
 * @apiDescription Create new Loan. 
 *
 * @apiParam {String} client Client Reference being screened
 *
 * @apiParamExample Request Example:
 *  {
 *    client : "556e1174a8952c9521286a60"
 *  }
 *
 * @apiSuccess {String} _id loan id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "LOAN_APPLICATION",
 *    subtitle: "Subtitle",
 *    title: "Title",
 *    purpose: "Loan Processing",
 *    has_sections: false,
 *    sections: [],
 *    layout: 'TWO_COLUMNS',
 *    disclaimer: "",
 *    signatures: ["Applicant", "Filled By", "Checked By"],
 *    questions: ]{
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *		 _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *  }
 *
 */
router.post('/create', acl(['*']), loanController.create);


/**
 * @api {get} /loans/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get loans collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Loan
 *
 * @apiDescription Get a collection of loans. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`. __QUERY SOURCE MUST BE SPECIFIED LIKE ?source=<web|app>__
 *
 * @apiSuccess {String} _id loan id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *    _id : "556e1174a8952c9521286a60",
 *    type: "LOAN_APPLICATION",
 *    subtitle: "Subtitle",
 *    title: "Title",
 *    purpose: "Loan Processing",
 *    has_sections: false,
 *    sections: [],
 *    layout: 'TWO_COLUMNS',
 *    disclaimer: "",
 *    signatures: ["Applicant", "Filled By", "Checked By"],
 *    questions: ]{
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *    }]
 *  }
 */
router.get('/paginate', acl(['*']), loanController.fetchAllByPagination);

/**
 * @api {get} /loans/search?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Search Loans
 * @apiVersion 1.0.0
 * @apiName Search
 * @apiGroup Loan
 *
 * @apiDescription Get a collection of loans by search. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`. __QUERY SOURCE MUST BE SPECIFIED LIKE ?source=<web|app>__
 *
 * @apiSuccess {String} _id loan id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "total_pages": 1,
 *    "total_docs_count": 0,
 *    "docs": [{
 *    _id : "556e1174a8952c9521286a60",
 *    type: "LOAN_APPLICATION",
 *    subtitle: "Subtitle",
 *    title: "Title",
 *    purpose: "Loan Processing",
 *    has_sections: false,
 *    sections: [],
 *    layout: 'TWO_COLUMNS',
 *    disclaimer: "",
 *    signatures: ["Applicant", "Filled By", "Checked By"],
 *    questions: ]{
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *    }]
 *  }
 */
router.get('/search', acl(['*']), loanController.search);


/**
 * @api {get} /loans/:id Get Loan Loan
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Loan
 *
 * @apiDescription Get a user loan with the given id
 *
 * @apiSuccess {String} _id loan id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "LOAN_APPLICATION",
 *    subtitle: "Subtitle",
 *    title: "Title",
 *    purpose: "Loan Processing",
 *    has_sections: false,
 *    sections: [],
 *    layout: 'TWO_COLUMNS',
 *    disclaimer: "",
 *    signatures: ["Applicant", "Filled By", "Checked By"],
 *    questions: ]{
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *  }
 *
 */
router.get('/:id', acl(['*']), loanController.fetchOne);


/**
 * @api {put} /loans/:id Update Loan Loan
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Loan 
 *
 * @apiDescription Update a Loan loan with the given id
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
 *    status "cancelled"
 * }
 *
 * @apiSuccess {String} _id loan id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "LOAN_APPLICATION",
 *    subtitle: "Subtitle",
 *    title: "Title",
 *    purpose: "Loan Processing",
 *    has_sections: false,
 *    sections: [],
 *    layout: 'TWO_COLUMNS',
 *    disclaimer: "",
 *    signatures: ["Applicant", "Filled By", "Checked By"],
 *    questions: ]{
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *  }
 */
router.put('/:id', acl(['*']), loanController.update);

/**
 * @api {put} /loans/:id/status Update Loan Status
 * @apiVersion 1.0.0
 * @apiName UpdateStatus
 * @apiGroup Loan 
 *
 * @apiDescription Update a Loan status with the given id
 *
 * @apiParam {String} status Update Status either incomplete, cancelled, submitted, completed or approved
 *
 * @apiParamExample Request example:
 * {
 *    status "cancelled"
 * }
 *
 * @apiSuccess {String} _id loan id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "LOAN_APPLICATION",
 *    subtitle: "Subtitle",
 *    title: "Title",
 *    purpose: "Loan Processing",
 *    has_sections: false,
 *    sections: [],
 *    layout: 'TWO_COLUMNS',
 *    disclaimer: "",
 *    signatures: ["Applicant", "Filled By", "Checked By"],
 *    questions: ]{
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *  }
 */
router.put('/:id/status', acl(['*']), loanController.updateStatus);

/**
 * @api {delete} /loans/:id Delete Loan
 * @apiVersion 1.0.0
 * @apiName DeleteLoan
 * @apiGroup Loan 
 *
 * @apiDescription Delete a Loan with the given id
 *
 * @apiSuccess {String} _id loan id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} subtitle Form Subtitle
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} purpose Form Purpose
 * @apiSuccess {Array} questions Form Questions
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Array} sections Form Sections
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User registering this
 * @apiSuccess {String} client Client Reference being screened
 * @apiSuccess {String} status Status ie incomplete, completed, cancelled, approved or submitted
 *
 * @apiSuccessExample Response Example:
 *  {
 *    _id : "556e1174a8952c9521286a60",
 *    type: "LOAN_APPLICATION",
 *    subtitle: "Subtitle",
 *    title: "Title",
 *    purpose: "Loan Processing",
 *    has_sections: false,
 *    sections: [],
 *    layout: 'TWO_COLUMNS',
 *    disclaimer: "",
 *    signatures: ["Applicant", "Filled By", "Checked By"],
 *    questions: ]{
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    }],
 *    created_by: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    client: {
 *     _id : "556e1174a8952c9521286a60",
 *       ....
 *    },
 *    status: "incomplete"
 *  }
 */
router.delete('/:id', acl(['*']), loanController.remove);



// Expose Loan Router
module.exports = router;
