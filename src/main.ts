import express, { Request, Response } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { Buffer } from "buffer";
import { Client } from 'pg';

import * as dotenv from 'dotenv';
dotenv.config();

export const app = express();

const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');

const handleRedirect = (req: IncomingMessage, res: ServerResponse, url: string) => {
  res.writeHead(302, { Location: url });
  res.end();
};

const urlsTable = process.env.POSTGRES_TABLE
const port = process.env.SERVICE_PORT

const pgClient = new Client({
  host: process.env.POSTGRES_HOST, // or your database host
  port: parseInt(process.env.POSTGRES_PORT || '0' ),        // default PostgreSQL port
  user: process.env.POSTGRES_USER, // your PostgreSQL user
  password: process.env.POSTGRES_PASSWORD, // your PostgreSQL password
  database: process.env.POSTGRES_DATABASE  // your PostgreSQL database
});

pgClient.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

app.use(express.json());

// Get health
app.get('/health', (req: Request, res: Response) => {
  res.json({health: 'Service up !'});
});

// Get short link
app.get('/:id', async (req: Request, res: Response) => {
    const linkId = req.params.id;
    try {
      console.time('queryDuration');
      const result = await pgClient.query(`SELECT url FROM ${urlsTable} WHERE id = $1`, [linkId]);
      console.timeEnd('queryDuration');
      if (result.rows.length === 0) {
        // Handle case where no record is found
        res.status(404).send(`Link not found`);
        return;
      }
      handleRedirect(req, res, result.rows[0].url)
    } catch (err) {
      console.error('Query error', err);
      res.status(500).send('Internal Server Error');
    }
});

// Create short link
app.post('/link', async (req: Request, res: Response) => {
    const body  = req.body;
    if (body.link) {
      try {
      console.log(body.link)
      const id = encode(body.link)
      const queryText = `INSERT INTO ${urlsTable}(id, url) VALUES($1, $2) RETURNING *`;
      const values = [id, body.link];
      const result = await pgClient.query(queryText, values);
      console.log('Inserted record:', result.rows[0]);
      res.json({id: id})
      } catch (err) {
      console.error('Query error', err);
      res.status(500).send('Internal Server Error');
      }
    } else {
      res.status(400).json({ error: 'Missing link from input' });
    }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});