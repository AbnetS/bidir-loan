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
 * @api {post} /loans/create Create new Loan application
 * @apiVersion 1.0.0
 * @apiName CreateLoanApp
 * @apiGroup Loan Application
 *
 * @apiDescription Create new Loan Application for a client
 *
 * @apiParam {String} client Client Id for which loan application is to be created for
 *
 * @apiParamExample Request Example:
 *  {
 *    client : "5ce00e2a2b6f530001b34621"
 *  }
 *  
 * @apiSuccess {String} _id Loan application id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Object[]} sections Form Sections
 * @apiSuccess {Object[]} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the loan application belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id who is the owner of the loan application
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
            "_id": "5dea1296a1713d0001f3ea83",
            "last_modified": "2019-12-06T08:34:30.282Z",
            "date_created": "2019-12-06T08:34:30.282Z",
            "client": {
                "_id": "5ce00e2a2b6f530001b34621",
                ...
            },
            "created_by": "5ce0047a8958650001a8001a",
            "branch": "5b9283679fb7f20001f1494d",
            "comment": "",
            "status": "new",
            "questions": [],
            "disclaimer": "",
            "signatures": [
                "Filled By",
                "Checked By"
            ],
            "sections": [
                {
                    "_id": "5dea1295a1713d0001f3ea5f",
                    "last_modified": "2019-12-06T08:34:29.988Z",
                    "date_created": "2019-12-06T08:34:29.988Z",
                    "questions": [
                        {
                            "_id": "5dea1295a1713d0001f3ea53",
                            ...
                        },
                        {
                            ...
                        }                         
                                                    
                    ],
                    "number": 1,
                    "title": "Economic Activities"
                },
                {
                    "_id": "5dea1296a1713d0001f3ea6b",
                    ...
                }
                ...
            ],
            "has_sections": true,
            "layout": "TWO_COLUMNS",
            "for_group": false,
            "purpose": "Loan Application For Debela Ibssa",
            "subtitle": "",
            "title": "Loan Form"
 *
 */
router.post('/create', acl(['*']), loanController.create);


/**
 * @api {get} /loans/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get loan applications collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Loan Application
 *
 * @apiDescription Get a collection of loan applications. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`. To get only __active__ loans append `show_active=true`
 * to the query.
 *
 * @apiSuccess {String} _id Loan application id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Object[]} sections Form Sections
 * @apiSuccess {Object[]} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the loan application belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id who is the owner of the loan application
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 14,
        "total_docs_count": 135,
        "current_page": 1,
        "docs": [
            {
                "_id": "5dea1296a1713d0001f3ea83",
                ...
            },
            {
                ...
            }
        ]
 *          
 *  }
 */
router.get('/paginate', acl(['*']), loanController.fetchAllByPagination);

/**
 * @api {get} /loans/search?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Search Loan Application
 * @apiVersion 1.0.0
 * @apiName Search
 * @apiGroup Loan Application
 *
 * @apiDescription Get a collection of loans by search. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`. __QUERY SOURCE MUST BE SPECIFIED LIKE ?source=<web|app>__
 *
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/loans/search?search=accepted
 * 
 * @apiSuccess {String} _id Loan application id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Object[]} sections Form Sections
 * @apiSuccess {Object[]} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the loan application belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id who is the owner of the loan application
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 2,
        "total_docs_count": 25,
        "current_page": 1,
        "docs": [
            {
                "_id": "5dea1296a1713d0001f3ea83",
                ...
            },
            {
                ...
            }
        ]
 *  }
 */
router.get('/search', acl(['*']), loanController.search);

/**
 * @api {get} /loans/clients/:id Get Client Loan Application
 * @apiVersion 1.0.0
 * @apiName ClientLoan
 * @apiGroup Loan Application
 *
 * @apiDescription Get a client loan application
 *
 * @apiSuccess {String} _id Loan application id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Object[]} sections Form Sections
 * @apiSuccess {Object[]} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the loan application belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id who is the owner of the loan application
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5dea1296a1713d0001f3ea83",
        "last_modified": "2019-12-06T08:34:30.282Z",
        "date_created": "2019-12-06T08:34:30.282Z",
        "client": {
            "_id": "5ce00e2a2b6f530001b34621",
            ...
        },
        "created_by": "5ce0047a8958650001a8001a",
        "branch": "5b9283679fb7f20001f1494d",
        "comment": "",
        "status": "new",
        "questions": [],
        "disclaimer": "",
        "signatures": [
            "Filled By",
            "Checked By"
        ],
        "sections": [
            {
                "_id": "5dea1295a1713d0001f3ea5f",
                "last_modified": "2019-12-06T08:34:29.988Z",
                "date_created": "2019-12-06T08:34:29.988Z",
                "questions": [
                    {
                        "_id": "5dea1295a1713d0001f3ea53",
                        ...
                    },
                    {
                        ...
                    }                         
                                                
                ],
                "number": 1,
                "title": "Economic Activities"
            },
            {
                "_id": "5dea1296a1713d0001f3ea6b",
                ...
            }
            ...
        ],
        "has_sections": true,
        "layout": "TWO_COLUMNS",
        "for_group": false,
        "purpose": "Loan Application For Debela Ibssa",
        "subtitle": "",
        "title": "Loan Form"
 *  }
 *
 */
router.get('/clients/:id', acl(['*']), loanController.getClientLoan);



/**
 * @api {get} /loans/:id Get Loan Application
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Loan Application
 *
 * @apiDescription Get a loan with the given id
 *
 * @apiSuccess {String} _id Loan application id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Object[]} sections Form Sections
 * @apiSuccess {Object[]} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the loan application belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id who is the owner of the loan application
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5dea1296a1713d0001f3ea83",
        "last_modified": "2019-12-06T08:34:30.282Z",
        "date_created": "2019-12-06T08:34:30.282Z",
        "client": {
            "_id": "5ce00e2a2b6f530001b34621",
            ...
        },
        "created_by": "5ce0047a8958650001a8001a",
        "branch": "5b9283679fb7f20001f1494d",
        "comment": "",
        "status": "new",
        "questions": [],
        "disclaimer": "",
        "signatures": [
            "Filled By",
            "Checked By"
        ],
        "sections": [
            {
                "_id": "5dea1295a1713d0001f3ea5f",
                "last_modified": "2019-12-06T08:34:29.988Z",
                "date_created": "2019-12-06T08:34:29.988Z",
                "questions": [
                    {
                        "_id": "5dea1295a1713d0001f3ea53",
                        ...
                    },
                    {
                        ...
                    }                         
                                                
                ],
                "number": 1,
                "title": "Economic Activities"
            },
            {
                "_id": "5dea1296a1713d0001f3ea6b",
                ...
            }
            ...
        ],
        "has_sections": true,
        "layout": "TWO_COLUMNS",
        "for_group": false,
        "purpose": "Loan Application For Debela Ibssa",
        "subtitle": "",
        "title": "Loan Form"
 *  }
 */
router.get('/:id', acl(['*']), loanController.fetchOne);


/**
 * @api {put} /loans/:id Update Loan Application
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Loan Application
 *
 * @apiDescription Update a Loan application with the given id
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
 *    comment: "Application is waiting for review"
 * }
 *
* @apiSuccess {String} _id Loan application id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Object[]} sections Form Sections
 * @apiSuccess {Object[]} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the loan application belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id who is the owner of the loan application
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5dea1296a1713d0001f3ea83",
        "last_modified": "2019-12-06T08:34:30.282Z",
        "date_created": "2019-12-06T08:34:30.282Z",
        "client": {
            "_id": "5ce00e2a2b6f530001b34621",
            ...
        },
        "created_by": "5ce0047a8958650001a8001a",
        "branch": "5b9283679fb7f20001f1494d",
        "comment": "Application is waiting for review",
        "status": "new",
        "questions": [],
        "disclaimer": "",
        "signatures": [
            "Filled By",
            "Checked By"
        ],
        "sections": [
            {
                "_id": "5dea1295a1713d0001f3ea5f",
                "last_modified": "2019-12-06T08:34:29.988Z",
                "date_created": "2019-12-06T08:34:29.988Z",
                "questions": [
                    {
                        "_id": "5dea1295a1713d0001f3ea53",
                        ...
                    },
                    {
                        ...
                    }                         
                                                
                ],
                "number": 1,
                "title": "Economic Activities"
            },
            {
                "_id": "5dea1296a1713d0001f3ea6b",
                ...
            }
            ...
        ],
        "has_sections": true,
        "layout": "TWO_COLUMNS",
        "for_group": false,
        "purpose": "Loan Application For Debela Ibssa",
        "subtitle": "",
        "title": "Loan Form"
 *  }
 */
router.put('/:id', acl(['*']), loanController.update);

/**
 * @api {put} /loans/:id/status Update Loan Application Status
 * @apiVersion 1.0.0
 * @apiName UpdateStatus
 * @apiGroup Loan Application
 *
 * @apiDescription Update a Loan application's status with the given id
 *
 * @apiParam {String} status. Status could only be 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 *
 * @apiParamExample Request example:
 * {
 *    status "inprogress"
 * }
 *
 * @apiSuccess {String} _id Loan application id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Object[]} sections Form Sections
 * @apiSuccess {Object[]} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the loan application belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id who is the owner of the loan application
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5dea1296a1713d0001f3ea83",
        "last_modified": "2019-12-06T08:34:30.282Z",
        "date_created": "2019-12-06T08:34:30.282Z",
        "client": {
            "_id": "5ce00e2a2b6f530001b34621",
            ...
        },
        "created_by": "5ce0047a8958650001a8001a",
        "branch": "5b9283679fb7f20001f1494d",
        "comment": "Application is waiting for review",
        "status": "inprogress",
        "questions": [],
        "disclaimer": "",
        "signatures": [
            "Filled By",
            "Checked By"
        ],
        "sections": [
            {
                "_id": "5dea1295a1713d0001f3ea5f",
                "last_modified": "2019-12-06T08:34:29.988Z",
                "date_created": "2019-12-06T08:34:29.988Z",
                "questions": [
                    {
                        "_id": "5dea1295a1713d0001f3ea53",
                        ...
                    },
                    {
                        ...
                    }                         
                                                
                ],
                "number": 1,
                "title": "Economic Activities"
            },
            {
                "_id": "5dea1296a1713d0001f3ea6b",
                ...
            }
            ...
        ],
        "has_sections": true,
        "layout": "TWO_COLUMNS",
        "for_group": false,
        "purpose": "Loan Application For Debela Ibssa",
        "subtitle": "",
        "title": "Loan Form"
 *  }
 */
router.put('/:id/status', acl(['*']), loanController.updateStatus);

/**
 * @api {delete} /loans/:id Delete Loan Application
 * @apiVersion 1.0.0
 * @apiName DeleteLoan
 * @apiGroup Loan Application
 *
 * @apiDescription Delete a Loan application with the given id
 *
 * @apiSuccess {String} _id Loan application id
 * @apiSuccess {String} type Form Type LOAN_APPLICATION
 * @apiSuccess {String} title Form Title
 * @apiSuccess {String} subtitle Form Subtitle 
 * @apiSuccess {String} purpose Form Purpose 
 * @apiSuccess {String} layout Form Layout ie TWO_COLUMNS or THREE_COLUMNS 
 * @apiSuccess {Boolean} has_sections If Form has Sections
 * @apiSuccess {Object[]} sections Form Sections
 * @apiSuccess {Object[]} questions Form Questions
 * @apiSuccess {Boolean} for_group true if the loan application belongs to a client in a group
 * @apiSuccess {String} disclaimer Disclaimer
 * @apiSuccess {Array} signatures Accepted Signatures
 * @apiSuccess {String} created_by User Id registering this
 * @apiSuccess {String} client Client Reference Id who is the owner of the loan application
 * @apiSuccess {String} branch Branch Reference Id in which the client is registered
 * @apiSuccess {String} status Status i.e 'inprogress','accepted', 'submitted','declined_final', 'declined_under_review'
 * @apiSuccess {String} comment Comment
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5dea1296a1713d0001f3ea83",
        "last_modified": "2019-12-06T08:34:30.282Z",
        "date_created": "2019-12-06T08:34:30.282Z",
        "client": {
            "_id": "5ce00e2a2b6f530001b34621",
            ...
        },
        "created_by": "5ce0047a8958650001a8001a",
        "branch": "5b9283679fb7f20001f1494d",
        "comment": "Application is waiting for review",
        "status": "inprogress",
        "questions": [],
        "disclaimer": "",
        "signatures": [
            "Filled By",
            "Checked By"
        ],
        "sections": [
            {
                "_id": "5dea1295a1713d0001f3ea5f",
                "last_modified": "2019-12-06T08:34:29.988Z",
                "date_created": "2019-12-06T08:34:29.988Z",
                "questions": [
                    {
                        "_id": "5dea1295a1713d0001f3ea53",
                        ...
                    },
                    {
                        ...
                    }                         
                                                
                ],
                "number": 1,
                "title": "Economic Activities"
            },
            {
                "_id": "5dea1296a1713d0001f3ea6b",
                ...
            }
            ...
        ],
        "has_sections": true,
        "layout": "TWO_COLUMNS",
        "for_group": false,
        "purpose": "Loan Application For Debela Ibssa",
        "subtitle": "",
        "title": "Loan Form"
 *  }
 */
router.delete('/:id', acl(['*']), loanController.remove);



// Expose Loan Router
module.exports = router;
