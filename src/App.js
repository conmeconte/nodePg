const sharp = require('sharp');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client } = require('pg');
const app = express();

const PORT = '8899';
const PIC_PATH = path.join(__dirname, '..', 'assets', 'IMG_0296.jpg');

const connectionString = process.env.DB_URL;
console.log('url ', connectionString);
const db = new Client({connectionString});


const init = async () => {
  await db.connect(); 
  await db.query('CREATE TABLE IF NOT EXISTS john (id SERIAL PRIMARY KEY, name VARCHAR, amount REAL)');

  app.use(express.json());
  app.use((req, res, next)=>{
    console.log(`Request time: ${Date().toLocaleString()}`);
    next();
  })

  app.get('/', (req, res) => {
    res.end('Hello')
  })

  app.get('/recent', async (req, res)=>{
    const { rows } = await db.query('SELECT * FROM john LIMIT 5');
    res.json({
      data: rows
    });
    res.end();
  });
  app.get('/total', async (req, res)=>{
    const { rows } = await db.query('SELECT name, SUM(amount) AS total FROM john GROUP BY 1');
    res.json({
      data: rows
    });
    res.end();
  });

  app.post('/new', async(req, res)=>{

    const { name, value } = req.body;
    if(name && value){
      console.log('here', name, value)
      try{
        await db.query('INSERT INTO john (name, amount) VALUES ($1, $2)', [name, value]);
        res.end();
      }catch(e){
        console.log('error', e);
        res.statusCode=400;
        res.end('Whats the matter', e);
      }
    }

    res.statusCode=400;
    res.end('Wrong stuff buddy')
  })

  app.get('/engineer/:name', (req,res)=>{
    console.log(req.params);
    res.end(`Hello, ${req.params.name}`)
  });

  // app.get('/picture', async (req, res) => {
  app.get('/picture', (req, res) => {
    // const picture = await fs.readFile(PIC_PATH);
    const source = fs.createReadStream(PIC_PATH);
    // const transformed = await sharp(picture).flip().flop().toBuffer();
    const flipperPie = sharp().flip().flop();
    source.pipe(flipperPie).pipe(res);
    // res.end(transformed)
  })

  app.use((req, res) => {
    res.statusCode = 404;
    res.end('What are you doing? 404');
  });

  app.listen(PORT, () => {
    console.log(`server is running at ${PORT}`)
  });
};

init(); 