import express, { Request, Response } from 'express';
import { Buffer } from "buffer";

const app = express();
const port = 3000;

const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');

app.use(express.json());

// Get health
app.get('/health', (req: Request, res: Response) => {
  res.json({health: 'Service up !'});
});

// Get short link
app.get('/:id', (req: Request, res: Response) => {
    const linkId = req.params.id;
    res.json({ message: `Fetching link with id ${linkId}` });
});

// Create short link
app.post('/link', (req: Request, res: Response) => {
    const { link } = req.body;
    if (link) {
      const id = encode(link)
      res.json({id: id})
    } else {
      res.status(400).json({ error: 'Missing link from input' });
    }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});