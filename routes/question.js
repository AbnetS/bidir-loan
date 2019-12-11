'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:question-router');

const questionController  = require('../controllers/question');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();


router.get('/paginate', acl(['*']), questionController.fetchAllByPagination);

/**
 * @api {get} /loans/questions/:id Get Question
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Question
 *
 * @apiDescription Get a question with the given id
 *
 * @apiSuccess {String} _id question id
 * @apiSuccess {String} question_text Question Text 
 * @apiSuccess {String} remark Question Remark
 * @apiSuccess {String} type Question Type ie YES_NO, FILL_IN_BLANK, MULTIPLE_CHOICE, SINGLE_CHOICE, GROUPED
 * @apiSuccess {String} sub_questions Nested Sub Questions References
 * @apiSuccess {Boolean} required Question mandatory or not(true or false)
 * @apiSuccess {String} validation_factor Question Validation Factor ie NONE, ALPHANUMERIC, NUMERIC, ALPHABETIC
 * @apiSuccess {Array} values Question Answer Values
 * @apiSuccess {Array} options Question Choices Options
 * @apiSuccess {Boolean} show Show Question true or false
 * @apiSuccess {Object[]} prerequisities Question Prerequisities
 * @apiSuccess {String} measurement_unit Measurement Unit
 * @apiSuccess {String} number Question Order number
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5b9274d263c2a40001f47498",
        "question_text": "Since when is the farmer a permanent resident of this Kebele?",
        "prerequisites": [],
        "show": true,
        "values": [],
        "sub_questions": [],
        "options": [],
        "measurement_unit": "Years",
        "validation_factor": "NONE",
        "required": true,
        "type": "FILL_IN_BLANK",
        "remark": "For at least 3 years",
        "number": 1
 *  }
 *
 */
router.get('/:id', acl(['*']), questionController.fetchOne);


/**
 * @api {put} /loans/questions/:id Update Question
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Question 
 *
 * @apiDescription Update a question with the given id, mostly used to save answers of a question in a given screening form
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
 *    "values":["yes"]
 * }
 *
 * @apiSuccess {String} _id question id
 * @apiSuccess {String} question_text Question Text 
 * @apiSuccess {String} remark Question Remark
 * @apiSuccess {String} type Question Type ie YES_NO, FILL_IN_BLANK, MULTIPLE_CHOICE, SINGLE_CHOICE, GROUPED
 * @apiSuccess {String} sub_questions Nested Sub Questions References
 * @apiSuccess {Boolean} required Question mandatory or not(true or false)
 * @apiSuccess {String} validation_factor Question Validation Factor ie NONE, ALPHANUMERIC, NUMERIC, ALPHABETIC
 * @apiSuccess {Array} values Question Answer Values
 * @apiSuccess {Array} options Question Choices Options
 * @apiSuccess {Boolean} show Show Question true or false
 * @apiSuccess {Object[]} prerequisities Question Prerequisities
 * @apiSuccess {String} measurement_unit Measurement Unit
 * @apiSuccess {String} number Question Order number
 * 
 * 
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5dea1295a1713d0001f3ea60",
        "question_text": "Borrowed in the past?",
        "prerequisites": [],
        "show": true,
        "values": [
            "yes"
        ],
        "sub_questions": [],
        "options": [
            "Yes",
            "No"
        ],
        "measurement_unit": null,
        "validation_factor": "NONE",
        "required": true,
        "type": "YES_NO",
        "remark": "",
        "number": 0
 *  }
 */
router.put('/:id', acl(['*']), questionController.update);

// Expose Question Router
module.exports = router;
