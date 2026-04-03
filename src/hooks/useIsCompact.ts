import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 1023px)";

export function useIsCompact() {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsCompact(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isCompact;
}
