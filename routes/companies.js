const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next)=>{
    try{
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({companies: results.rows})
    }catch(e){
        return next(e);
    }
})

router.get('/:code', async (req, res, next) =>{
    try{
        const { code } = req.params;

        const results = await db.query(`SELECT * FROM companies WHERE code = $1`, [code])
        const invoiceResult = await db.query(
            `SELECT id FROM invoices
            WHERE comp_code = $1`,[code])

        const industryResult = await db.query(`
        SELECT c.code,c.name, i.code  
        FROM companies AS c 
        LEFT JOIN ind_comp AS ic ON ic.comp_code = c.code 
        LEFT JOIN industries AS i ON ic.ind_code = i.code
        WHERE c.code = $1;
        `, [code])

      
          
        const company  = results.rows[0]
        const invoices = invoiceResult.rows;
        const industries = industryResult.rows
        
        
        company.invoices = invoices.map(inv => inv.id);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
        company.industries = industries.map(ind => ind.code)
        return res.send({company: company})
    }catch(e){
        return next(e)
    }
})

router.post('/', async (req, res, next) =>{
    try{
        const {code, name, description} = req.body;
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
  
        return res.status(201).json({company: results.rows[0]})
    } catch (e){
        return next(e)
    }
})

router.patch('/:code', async (req, res, next)=>{
    try{
        const { code } = req.params;
        const { name, description, ind_code } = req.body;
        const results = await db.query('UPDATE companies SET name=$1, description=$2, ind_code=$4 WHERE code=$3 RETURNING code, name, description, ind_code', [name, description, code, ind_code])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update user with code of ${code}`, 404)
          }
          
          return res.json({updated: results.rows[0]})
    } catch(e){
        return next(e)
    }
})

router.delete('/:code', async (req, res, next) =>{
    
    try{
        const { code } = req.params;
        const results = db.query('DELETE FROM companies WHERE code = $1', [ code ]);
        return res.json({status: 'deleted'})
    } catch (e){
        return next(e)
    }
})

module.exports = router;