export const cityImageExtensions = {
  ahmedabad: 'png',
  bali: 'png',
  florence: 'jpg',
  kyoto: 'png',
  leh: 'jpg',
  london: 'png',
  mumbai: 'jpg',
  paris: 'png',
  rajkot: 'jpg',
  rajula: 'png',
  rome: 'png',
  tokyo: 'jpg',
  valsad: 'jpg',
};

const DEFAULT_EXTENSION = 'jpg';

// Returns a usable image URL for a destination/city, falling back to a
// guessed local asset path when no explicit image field is present.
export function getCityImageUrl(destination) {
  if (destination?.image) {
    return destination.image;
  }

  const cityName = (destination?.name || '').toLowerCase();
  const extension = cityImageExtensions[cityName] || DEFAULT_EXTENSION;

  return `/${cityName}.${extension}`;
}
