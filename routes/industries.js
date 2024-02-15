const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next)=>{
    try{
        const results = await db.query(`SELECT * FROM industries`);
        return res.json({industries: results.rows})
    }catch(e){
        return next(e);
    }
})

router.get('/:code', async (req, res, next)=>{
    try{
        const {code} = req.params;
        const industryResults = await db.query(`SELECT * FROM industries WHERE code = $1`, [code]);
        const companyResults = await db.query(
            `SELECT i.code, i.name, c.code 
            FROM industries AS i 
            LEFT JOIN ind_comp AS ic ON ic.ind_code = i.code 
            LEFT JOIN companies AS c ON ic.comp_code = c.code 
            WHERE i.code =$1;`, [code]);
        const companies = companyResults.rows
        const industry = industryResults.rows[0];
       
        
        if (industryResults.rows.length === 0){
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
       
        industry.companies = companies.map(comp => comp.code)
        return res.send({industry:industry})
    }catch(e){
        next(e)
    }
})

router.get('/', async (req, res, next)=>{
    try{
        const {code, name} = req.body;
        const results = await db.query(`INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING code, name`, [code, name]);
        return res.status(201).json({industry: results.rows[0]})
    }catch(e){
        return next(e)
    }
})

module.exports = router;