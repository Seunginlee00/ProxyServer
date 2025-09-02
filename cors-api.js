// 모든 origin을 허용하는 설정
export const corsAllowAllOptions = {
  origin: true, // 모든 origin 허용
  credentials: true,
  methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
  allowedHeaders: 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, x-original-url',

};

// 특정 도메인만 허용하는 CORS 설정
const allowedOrigins = [
  'http://localhost:8080',
  'http://도메인'
];

// 정규식 리스트 수정
const regexList = [
  new RegExp('\\.도메인\\.특정url$'),
];

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  return allowedOrigins.includes(origin) || regexList.some(re => re.test(origin));
};

// CORS 옵션을 동적으로 처리하는 설정
export const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  if (isAllowedOrigin(origin)) {
    callback(null, {
      origin: true, // 해당 origin을 허용
      credentials: true,
      methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, x-original-url',

    });
  } else {
    callback(null, { origin: false }); // 허용되지 않은 origin
  }
};

