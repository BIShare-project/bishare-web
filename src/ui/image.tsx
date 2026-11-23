interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

/** A picture that loads when it comes near, unless it is the first thing on the page. */
export default function Image({ priority, className, ...props }: Props) {
  return <img loading={priority ? undefined : "lazy"} decoding="async" {...props} class={className} />;
}
