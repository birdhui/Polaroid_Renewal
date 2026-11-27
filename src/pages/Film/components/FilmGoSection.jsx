import lettering from '@/assets/film/go/go-design-lettering.png';
import photo from '@/assets/film/go/go-close-up-print.png';
import FilmStockSection from './FilmStockSection.jsx';

const go = {
  id: 'go',
  name: 'Go',
  selection: 'Selection 1',
  lettering: { src: lettering, width: 1792, height: 768, strokeTransform: 'translate(-655 -118) scale(1.58 1.338)' },
  photo: { src: photo, width: 1122, height: 1402, alt: '얼굴을 가까이 댄 두 사람이 담긴 Go 필름 사진' },
  caption: ['작은 프레임에 담는 커다란 순간,', '어디서든 일상이 특별한 기록으로.'],
  cameras: ['Go'],
  kind: 'Color',
  vertical: [
    { value: '47', label: '사진 높이', size: 15, before: 115, after: 115 },
    { value: '66.6', label: '프레임 높이', size: 27, before: 130, after: 130 },
  ],
  horizontal: [
    { value: '46', label: '사진 너비', size: 17, before: 82, after: 82 },
    { value: '53.9', label: '프레임 너비', size: 26, before: 97, after: 97 },
  ],
};

export default function FilmGoSection() {
  return <FilmStockSection stock={go} />;
}
