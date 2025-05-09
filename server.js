import express from 'express';
import builder from './src/builder/image.js';
import cors from 'cors';
import { corsAllowAllOptions, corsOptionsDelegate } from './cors-api.js';

const app = express();
const PORT = process.env.PORT || 8787;

// CORS 설정 간소화
app.use('/api/x', cors(corsAllowAllOptions));
app.use(cors(corsOptionsDelegate));

app.use((req, res, next) => {
  console.log(`[요청] ${req.method} ${req.url}`);
  next();
});

// url 
app.use('/api/builder', builder);

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});