import loadingBg from '@/assets/compare/loading/loading-bg.webp';
import { LOADING_PHOTOS } from '@/pages/Compare/data/compareLoadingPhotos.js';

/** 이미지를 기다리는 최대 시간(ms) — 이보다 오래 걸려도 로딩 화면은 시작한다 */
const PRELOAD_TIMEOUT = 1500;

// 한 번만 불러오고, 이미지가 메모리에서 사라지지 않도록 붙잡아 둔다.
let pending = null;
const held = [];

/**
 * 로딩 화면(CompareLoading)에 쓰는 이미지를 미리 불러와 디코딩해 둔다.
 * 채팅 단계에서 한 번 부르면, 로딩 화면이 처음 그려질 때 이미지를 해석하느라 모션이 멈칫하는 일이 없다.
 * 여러 번 불러도 한 번만 실행되고, 같은 Promise 를 돌려준다. (실패해도 reject 하지 않는다)
 *
 * @returns {Promise<void>}
 */
export default function preloadLoadingImages() {
  if (pending) return pending;

  const urls = [loadingBg, ...LOADING_PHOTOS.flatMap((photo) => [photo.wide, photo.square])].filter(Boolean);
  const loads = urls.map((url) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    held.push(image);
    return (image.decode ? image.decode() : Promise.resolve()).catch(() => {});
  });
  const timeout = new Promise((resolve) => {
    setTimeout(resolve, PRELOAD_TIMEOUT);
  });
  pending = Promise.race([Promise.all(loads), timeout]).then(() => {});
  return pending;
}
