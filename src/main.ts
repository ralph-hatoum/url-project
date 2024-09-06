import express, { Request, Response } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { Buffer } from "buffer";
import { Client, QueryResult } from 'pg';
import { performance } from 'perf_hooks';

import * as dotenv from 'dotenv';
dotenv.config();

export const app = express();

const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');

const handleRedirect = (req: IncomingMessage, res: ServerResponse, url: string) => {
  res.writeHead(302, { Location: url });
  res.end();
};

const urlsTable = process.env.POSTGRES_URL_TABLE
const queryDurationTable = process.env.POSTGRES_QUERY_DURATION_TABLE
const queryCountTable = process.env.POSTGRES_QUERY_COUNT
const port = process.env.SERVICE_PORT

export const pgClient = new Client({
  host: process.env.POSTGRES_HOST, // or your database host
  port: parseInt(process.env.POSTGRES_PORT || '0' ),        // default PostgreSQL port
  user: process.env.POSTGRES_USER, // your PostgreSQL user
  password: process.env.POSTGRES_PASSWORD, // your PostgreSQL password
  database: process.env.POSTGRES_DATABASE  // your PostgreSQL database
});

pgClient.connect()
    .then(() => {
      console.log('Connected to PostgreSQL');
      app.emit('ready'); 
    })
    .catch(err => console.error('Connection error', err.stack));

app.use(express.json());

// Get health
app.get('/health', (req: Request, res: Response) => {
  res.json({health: 'Service up !'});
});

// Get short link
app.get('/:id', async (req: Request, res: Response) => {
    const linkId = req.params.id;
    console.log(`Handling request for ID ${linkId}`)
    try {
      var [result, queryDuration] = await readLinkFromDb(linkId)
      if (result.rows.length === 0) {
        // Handle case where no record is found
        res.status(404).send(`Link not found`);
        return;
      }
      handleRedirect(req, res, result.rows[0].url)
      insertQueryDuration("get_link_from_id", queryDuration)
      insertQueryCount("get_link_from_id")
    } catch (err) {
      console.error('Query error', err);
      res.status(500).send('Internal Server Error');
    }
});

// Create short link
app.post('/link', async (req: Request, res: Response) => {
  // todo : creating link that already exists should just return the link id
    const body  = req.body;
    if (body.link) {
      try {
      console.log(body.link)
      const id = encode(body.link)
      var queryDuration = await insertLinkInDb(body.link, id)
      res.status(201).json({id: id})
      insertQueryDuration("new_short_link", queryDuration)
      insertQueryCount("new_short_link")
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

async function insertLinkInDb(link: string, id: string): Promise<number> {
  const queryText = `INSERT INTO ${urlsTable}(id, url) VALUES($1, $2) RETURNING *`;
  const values = [id, link]

  const start = performance.now();
  const result = await pgClient.query(queryText, values);
  const end = performance.now();

  console.log('Inserted record:', result.rows[0]);

  const queryDuration = end - start;

  return queryDuration
}

async function insertQueryDuration(requestType: string, queryDuration: number) {
  const queryText = `INSERT INTO ${queryDurationTable}(request_type, duration) VALUES($1, $2) RETURNING *`;
  const values = [requestType, queryDuration];
  await pgClient.query(queryText, values);
}

async function insertQueryCount(requestType: string) {
  var queryText = `UPDATE ${queryCountTable} SET number_of_requests = number_of_requests + 1 WHERE request_type = '${requestType}';`;
  await pgClient.query(queryText);
}

async function readLinkFromDb(id: string): Promise<[QueryResult<any>,number]> {
  const start = performance.now();
  const result = await pgClient.query(`SELECT url FROM ${urlsTable} WHERE id = $1`, [id]);
  const end = performance.now();
  const queryDuration = end - start;
  return [result, queryDuration]
}