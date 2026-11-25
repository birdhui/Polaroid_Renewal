export default function FilmRecapImage({ photo }) {
  return (
    <svg width="100%" height="100%" viewBox={photo.crop} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <image
        href={photo.src}
        width={photo.width}
        height={photo.height}
        style={photo.monochrome ? { filter: 'grayscale(1)' } : undefined}
      />
    </svg>
  );
}
