"use client";

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

export default function PerfumeImage({ src, alt, className, loading }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
      }}
    />
  );
}
