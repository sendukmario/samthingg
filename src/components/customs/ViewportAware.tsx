import React, { useEffect, useRef, useState } from "react";

type ViewportAwareProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The content to render when the component enters the viewport.
   */
  children: React.ReactNode;

  /**
   * Minimum height (in pixels) of the placeholder element before visibility.
   * Defaults to 50.
   */
  placeholderHeight?: number;
};

/**
 * Lazily renders its children only when the component enters the viewport.
 * Useful for performance optimization in scroll-heavy views like lists or feeds.
 *
 * @remarks
 * Uses the Intersection Observer API. Children will not mount until visible.
 */
export const ViewportAware = ({
  children,
  placeholderHeight = 50,
  ...rest
}: ViewportAwareProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      {
        rootMargin: "100px",
      },
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="w-full"
      style={{ minHeight: placeholderHeight, ...(rest.style || {}) }}
      {...rest}
    >
      {isVisible ? children : null}
    </div>
  );
};
