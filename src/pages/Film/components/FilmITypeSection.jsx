import lettering from '@/assets/film/i-type/i-type-design-lettering.png';
import photo from '@/assets/film/intro-prints/santa-dog.png';
import FilmStockSection from './FilmStockSection.jsx';

const iType = {
  id: 'i-type',
  name: 'i-Type',
  selection: 'Selection 2',
  lettering: { src: lettering, width: 1920, height: 640, strokeTransform: 'translate(-244 -27.4) scale(1.063 1.031)' },
  photo: { src: photo, width: 1122, height: 1402, alt: '산타 모자를 쓴 강아지가 담긴 i-Type 필름 사진' },
  caption: ['폴라로이드만의 클래식한 프레임,', '스쳐 가는 순간도 오래도록 남도록', '.'],
  cameras: ['Now', 'Now+', 'Flip', 'Mod', 'I-2'],
  kind: 'B&W / Color',
  vertical: [
    { value: '78.9', label: '사진 높이', size: 26, before: 115, after: 101 },
    { value: '107.5', label: '프레임 높이', size: 32, before: 158, after: 158 },
  ],
  horizontal: [
    { value: '76.8', label: '사진 너비', size: 27, before: 103, after: 104 },
    { value: '88.5', label: '프레임 너비', size: 27, before: 116, after: 115 },
  ],
};

export default function FilmITypeSection() {
  return <FilmStockSection stock={iType} />;
}
