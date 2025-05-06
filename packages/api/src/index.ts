import { Hono } from 'hono';
import apiRouter from './routes';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// APIルートをマウント
app.route('/api', apiRouter);

export default app;
