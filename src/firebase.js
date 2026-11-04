import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase 콘솔 > 프로젝트 설정 > 내 앱 에서 받은 값입니다.
// 이 값은 원래 웹페이지에 공개되는 값이라 저장소에 있어도 괜찮습니다.
// 데이터 보호는 firestore.rules(보안 규칙)가 담당합니다.
const firebaseConfig = {
  apiKey: 'AIzaSyBNV5v_cK1T3tp3kDuXAP6Wg0z9r3jHDzg',
  authDomain: 'common-social-studies.firebaseapp.com',
  projectId: 'common-social-studies',
  storageBucket: 'common-social-studies.firebasestorage.app',
  messagingSenderId: '947075209071',
  appId: '1:947075209071:web:1168d1d3b726df3d437a9a',
};

export const useEmulator = import.meta.env.VITE_USE_EMULATOR === '1';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 개발용: npm run dev:emu 로 실행하면 실제 데이터 대신 내 컴퓨터의 테스트용 Firebase에 연결
if (import.meta.env.VITE_USE_EMULATOR === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
