const BAD_ID_CHARS = /[\\/:*?"<>|]/g;

export function cutoutName(id: string): string {
  return id.replace(BAD_ID_CHARS, "_");
}

export function cutoutSrc(id: string): string {
  return `/cutouts/${encodeURIComponent(cutoutName(id))}.webp`;
}
