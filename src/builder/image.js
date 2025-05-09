import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.get('/', async (req, res) => {
  let azureUrl = req.headers['x-original-url'];
  if (!azureUrl) {
    return res.status(400).json({ error: 'X-Original-Url 헤더가 없습니다' });
  }

  console.log(`원본 요청 URL: ${azureUrl}`);

  try {
    // URL 유효성 검사
    try {
      new URL(azureUrl);
    } catch {
      return res.status(400).json({ error: '잘못된 URL 형식입니다' });
    }

    // 자기 자신 호출 방지
    const hostname = req.hostname;
    if (azureUrl.includes(hostname)) {
      return res.status(400).json({ error: '자기 자신을 호출할 수 없습니다' });
    }

    // 경로 인코딩
    const parsedUrl = new URL(azureUrl);
    const pathParts = parsedUrl.pathname.split('/');
    parsedUrl.pathname = pathParts.map(part => {
      if (part.includes('%')) return part;
      if (/[^\w\-./]/.test(part)) return encodeURIComponent(part);
      return part;
    }).join('/');
    azureUrl = parsedUrl.toString();

    // SAS 토큰 추가
    const sasToken = process.env.AZURE_SAS_TOKEN;
    if (azureUrl.includes('blob.core.windows.net') && !azureUrl.includes('sig=') && sasToken) {
      const token = sasToken.startsWith('?') ? sasToken : '?' + sasToken;
      azureUrl += azureUrl.includes('?') ? '&' + token.slice(1) : token;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const headers = {};
    if (azureUrl.includes('blob.core.windows.net')) {
      headers['x-ms-version'] = '2020-04-08';
      headers['x-ms-date'] = new Date().toUTCString();
    }

    console.log(`최종 요청: ${azureUrl}`);

    const response = await fetch(azureUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: `Azure 오류: ${response.statusText}`,
        body: text
      });
    }

    const buffer = await response.arrayBuffer();
    res.set('Content-Type', contentType);
    res.status(200).send(Buffer.from(buffer));

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: '요청 시간 초과됨' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
